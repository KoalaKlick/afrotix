import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import transporter from "@/lib/mail";
import { render } from "@react-email/render";
import React from "react";
import { TicketDeliveryEmail } from "@/emails/ticket-delivery";
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
      const metadata = payment.metadata as Record<string, any>;

      const { data: order, error: orderError } = await supabase
        .from("ticket_orders")
        .select("id, event_id, order_number, buyer_name, buyer_phone, subtotal")
        .eq("payment_id", payment.id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: "Ticket order not found" }, { status: 404 });
      }

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id, title, start_date, venue_name, venue_city, organization_id")
        .eq("id", order.event_id)
        .single();

      if (eventError || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id, name, logo_url, contact_email")
        .eq("id", event.organization_id)
        .single();

      if (organizationError || !organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, ticket_code, ticket_type_id")
        .eq("order_id", order.id);

      if (ticketsError) {
        return NextResponse.json({ error: "Tickets not found" }, { status: 404 });
      }

      const ticketTypeIds = [...new Set((tickets ?? []).map((t) => t.ticket_type_id).filter(Boolean))];

      const { data: ticketTypes, error: ticketTypesError } = ticketTypeIds.length
        ? await supabase
            .from("ticket_types")
            .select("id, name, price, currency")
            .in("id", ticketTypeIds)
        : { data: [], error: null };

      if (ticketTypesError) {
        return NextResponse.json({ error: "Ticket types not found" }, { status: 404 });
      }

      const ticketTypeMap = new Map(
        (ticketTypes ?? []).map((t) => [
          t.id,
          { name: t.name, price: Number(t.price) || 0, currency: t.currency || "GHS" },
        ])
      );

      const groupedItems = new Map<string, { name: string; quantity: number; unitPrice: number; currency: string }>();

      for (const ticket of tickets ?? []) {
        const typeInfo = ticketTypeMap.get(ticket.ticket_type_id);
        const key = ticket.ticket_type_id;
        const current = groupedItems.get(key);

        if (current) {
          current.quantity += 1;
        } else {
          groupedItems.set(key, {
            name: typeInfo?.name ?? "Ticket",
            quantity: 1,
            unitPrice: typeInfo?.price ?? 0,
            currency: typeInfo?.currency ?? "GHS",
          });
        }
      }

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_DOMAIN_URL || "").replace(/\/$/, "");
      const secret = process.env.TICKET_SIGNING_SECRET;

      if (!secret) {
        console.warn("TICKET_SIGNING_SECRET missing. Cannot generate ticket URLs.");
      }

      const ticketUrls = (tickets ?? []).map((ticket) => {
        if (!appUrl || !secret) return "";
        const payload = `${ticket.id}:${ticket.ticket_code}`;
        const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
        const tokenData = { tId: ticket.id, tCode: ticket.ticket_code, sig };
        const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");
        return `${appUrl}/ticket/view?token=${token}`;
      }).filter(Boolean);

      const buyerEmail = payment.email || metadata.buyer_email;

      if (!buyerEmail) {
        return NextResponse.json({ success: true, channel: "none", skipped: "missing_email" });
      }

      const emailHtml = await render(
        React.createElement(TicketDeliveryEmail, {
          buyerName: order.buyer_name || metadata.buyer_name || "Guest",
          organizationName: organization.name,
          organizationLogoUrl: organization.logo_url,
          organizationContactEmail: organization.contact_email,
          eventTitle: event.title,
          eventStartDate: event.start_date?.toString() || null,
          venueName: event.venue_name,
          venueCity: event.venue_city,
          orderNumber: order.order_number,
          subtotal: Number(order.subtotal) || Number(payment.amount),
          currency: payment.currency || "GHS",
          ticketCount: tickets.length || Math.max(1, Number(metadata.quantity) || 1),
          ticketUrls,
          lineItems: Array.from(groupedItems.values()),
        })
      );

      const fromName = process.env.SMTP_FROM_NAME || "Afrotix";
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

      const options = {
        from: `"${fromName}" <${fromEmail}>`,
        to: buyerEmail,
        subject: `Your Tickets for ${event.title}`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(options);

      const deliveryMetadata = {
        ...metadata,
        delivery_email_sent_at: new Date().toISOString(),
        delivery_email_to: buyerEmail,
        delivery_email_result: info.messageId,
      };

      await supabase
        .from("payments")
        .update({ metadata: deliveryMetadata })
        .eq("id", paymentId);

      return NextResponse.json({ success: true, channel: "email", messageId: info.messageId });
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

      const { sendNominationConfirmationEmail } = await import("@/lib/email-actions");
      const result = await sendNominationConfirmationEmail({
        email: recipientEmail,
        recipientName: option.nominated_by_name || recipientEmail,
        nomineeName: option.option_text,
        categoryName: category?.name || "this category",
        eventName: event?.title || "this event",
        deletionCode: option.deletion_code,
      });

      await supabase
        .from("payments")
        .update({
          metadata: {
            ...(typeof payment.metadata === "object" && payment.metadata !== null ? payment.metadata : {}),
            nomination_email_sent_at: new Date().toISOString(),
            nomination_email_to: recipientEmail,
            ...(result.success ? { nomination_email_message_id: (result as { messageId?: string }).messageId } : {}),
          },
        })
        .eq("id", paymentId);

      return NextResponse.json({ success: true, channel: "email" });
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
