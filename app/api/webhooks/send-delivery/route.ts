import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import transporter from "@/lib/mail";
import { render } from "@react-email/render";
import React from "react";
import { sendTicketDeliveryEmail } from "@/lib/email-actions";
import { NominationConfirmationEmail } from "@/emails/nomination-confirmation";
import crypto from "node:crypto";

// Use service role key — this route is only called server-to-server
// (webhook edge function or server actions). The anon key + RLS would block reads.
function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Fetch Payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // 2. Ticket purchase emails
    if (payment.related_type === "ticket_order" || payment.related_type === "ticket") {
      const result = await sendTicketDeliveryEmail(paymentId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, channel: "email", messageId: result.messageId });
    }

    // 2b. Paid nomination confirmation email
    if (payment.related_type === "nomination") {
      if (!payment.related_id) {
        console.error("send-delivery: nomination payment has no related_id yet", paymentId);
        return NextResponse.json({ success: true, channel: "none", skipped: "no_related_id" });
      }

      const { data: option } = await supabase
        .from("voting_options")
        .select("id, option_text, email, nominated_by_email, nominated_by_name, deletion_code, category_id, event_id")
        .eq("id", payment.related_id)
        .single();

      if (!option) {
        console.error("send-delivery: voting_option not found for nomination payment", { paymentId, relatedId: payment.related_id });
        return NextResponse.json({ success: true, channel: "none", skipped: "option_not_found" });
      }

      const recipientEmail = (option.nominated_by_email || option.email) as string | null;
      if (!recipientEmail) {
        return NextResponse.json({ success: true, channel: "none", skipped: "no_recipient_email" });
      }

      const [{ data: category }, { data: event }] = await Promise.all([
        supabase.from("voting_categories").select("name").eq("id", option.category_id).single(),
        supabase.from("events").select("title").eq("id", option.event_id).single(),
      ]);

      const emailHtml = await render(
        React.createElement(NominationConfirmationEmail, {
          recipientName: option.nominated_by_name || recipientEmail,
          nomineeName: option.option_text,
          categoryName: category?.name || "this category",
          eventName: event?.title || "this event",
          deletionCode: option.deletion_code,
        })
      );

      const fromName = process.env.SMTP_FROM_NAME || "Afrotix";
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      const subject = option.deletion_code
        ? `Your nomination for ${event?.title || "the event"} is live — exit key inside`
        : `Nomination received for ${event?.title || "the event"} — pending review`;

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject,
        html: emailHtml,
      });

      await supabase
        .from("payments")
        .update({
          metadata: {
            ...(typeof payment.metadata === "object" && payment.metadata !== null ? payment.metadata : {}),
            nomination_email_sent_at: new Date().toISOString(),
            nomination_email_to: recipientEmail,
            nomination_email_message_id: info.messageId,
          },
        })
        .eq("id", paymentId);

      return NextResponse.json({ success: true, channel: "email", messageId: info.messageId });
    }

    // 3. Legacy credit-based delivery path for other payment types (Votes etc)
    const { data: organizer, error: organizerError } = payment.user_id
      ? await supabase
          .from("profiles")
          .select("id, utility_credits, whatsapp_opt_in")
          .eq("id", payment.user_id)
          .single()
      : { data: null, error: null };

    if (organizerError || !organizer) {
      return NextResponse.json({ success: true, channel: "none", skipped: "missing_profile" });
    }

    let channel = organizer.whatsapp_opt_in ? "whatsapp" : "sms";
    let requiredCredits = organizer.whatsapp_opt_in ? 1.5 : 1.0;

    if (organizer.utility_credits < requiredCredits) {
      channel = "email";
      requiredCredits = 0;
    }

    if (requiredCredits > 0) {
      await supabase
        .from("profiles")
        .update({ utility_credits: organizer.utility_credits - requiredCredits })
        .eq("id", organizer.id);
    }

    return NextResponse.json({ success: true, channel, creditsDeducted: requiredCredits });

  } catch (err: any) {
    console.error("Delivery error:", err);
    return NextResponse.json({ error: "Internal Error", details: err.message }, { status: 500 });
  }
}
