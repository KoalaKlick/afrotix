import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { buildTicketPurchaseEmail } from "../_shared/email-templates.ts";

import nodemailer from "npm:nodemailer";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const host = Deno.env.get("SMTP_HOST");
  const port = Deno.env.get("SMTP_PORT") || "587";
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const fromName = Deno.env.get("SMTP_FROM_NAME") || "Afrotix";
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || user;

  if (!host || !user || !pass) {
    console.warn("SMTP credentials not configured. Skipping email send.");
    return { skipped: true, reason: "missing_smtp_credentials" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port === "465" || Deno.env.get("SMTP_SECURE") === "true",
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return info;
  } catch (error) {
    console.error("Nodemailer send failure:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}


serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { paymentId } = await req.json();

    // 1. Fetch Payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) return new Response("Payment not found", { status: 404 });

    // 2. Ticket purchase emails
    if (payment.related_type === "ticket_order" || payment.related_type === "ticket") {
      const metadata = asRecord(payment.metadata);

      const { data: order, error: orderError } = await supabase
        .from("ticket_orders")
        .select("id, event_id, order_number, buyer_name, buyer_phone, subtotal")
        .eq("payment_id", paymentId)
        .single();

      if (orderError || !order) {
        console.error("Ticket order lookup failed:", orderError);
        return new Response("Ticket order not found", { status: 404 });
      }

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id, title, slug, start_date, venue_name, venue_city, organization_id")
        .eq("id", order.event_id)
        .single();

      if (eventError || !event) {
        console.error("Event lookup failed:", eventError);
        return new Response("Event not found", { status: 404 });
      }

      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, contact_email")
        .eq("id", event.organization_id)
        .single();

      if (organizationError || !organization) {
        console.error("Organization lookup failed:", organizationError);
        return new Response("Organization not found", { status: 404 });
      }

      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, ticket_code, ticket_type_id")
        .eq("order_id", order.id);

      if (ticketsError) {
        console.error("Ticket lookup failed:", ticketsError);
        return new Response("Tickets not found", { status: 404 });
      }

      const ticketTypeIds = [...new Set((tickets ?? []).map((ticket) => ticket.ticket_type_id).filter(Boolean))];

      const { data: ticketTypes, error: ticketTypesError } = ticketTypeIds.length
        ? await supabase
            .from("ticket_types")
            .select("id, name, price, currency")
            .in("id", ticketTypeIds)
        : { data: [], error: null };

      if (ticketTypesError) {
        console.error("Ticket type lookup failed:", ticketTypesError);
        return new Response("Ticket types not found", { status: 404 });
      }

      const ticketTypeMap = new Map(
        (ticketTypes ?? []).map((ticketType) => [
          ticketType.id,
          {
            name: ticketType.name,
            price: asNumber(ticketType.price),
            currency: asString(ticketType.currency) ?? "GHS",
          },
        ]),
      );

      const groupedItems = new Map<string, { name: string; quantity: number; unitPrice: number; currency: string }>();

      for (const ticket of tickets ?? []) {
        const ticketType = ticketTypeMap.get(ticket.ticket_type_id);
        const key = ticket.ticket_type_id;
        const current = groupedItems.get(key);

        if (current) {
          current.quantity += 1;
          continue;
        }

        groupedItems.set(key, {
          name: ticketType?.name ?? "Ticket",
          quantity: 1,
          unitPrice: ticketType?.price ?? 0,
          currency: ticketType?.currency ?? "GHS",
        });
      }

      const appUrl = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");
      const secret = Deno.env.get("TICKET_SIGNING_SECRET");

      const ticketUrls = (tickets ?? []).map((ticket) => {
        if (!appUrl || !secret) return "";
        const payload = `${ticket.id}:${ticket.ticket_code}`;
        const sig = createHmac("sha256", secret).update(payload).digest("hex");
        const tokenData = { tId: ticket.id, tCode: ticket.ticket_code, sig };
        // Base64URL encode the JSON
        const token = btoa(JSON.stringify(tokenData)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return `${appUrl}/ticket/view?token=${token}`;
      }).filter(Boolean);


      const buyerEmail = asString(payment.email) ?? asString(metadata.buyer_email);

      if (!buyerEmail) {
        console.warn(`Payment ${paymentId} has no buyer email. Skipping email delivery.`);
        return new Response(JSON.stringify({ success: true, channel: "none", skipped: "missing_email" }), { status: 200 });
      }

      const email = buildTicketPurchaseEmail({
        buyerName: asString(order.buyer_name) ?? asString(metadata.buyer_name),
        organizationName: organization.name,
        organizationLogoUrl: asString(organization.logo_url),
        organizationContactEmail: asString(organization.contact_email),
        eventTitle: event.title,
        eventStartDate: asString(event.start_date),
        venueName: asString(event.venue_name),
        venueCity: asString(event.venue_city),
        orderNumber: order.order_number,
        subtotal: asNumber(order.subtotal, asNumber(payment.amount)),
        currency: asString(payment.currency) ?? "GHS",
        ticketCount: (tickets ?? []).length || Math.max(1, asNumber(metadata.quantity, 1)),
        ticketUrls,
        lineItems: [...groupedItems.values()],
      });

      const deliveryResult = await sendEmail({
        to: buyerEmail,
        subject: email.subject,
        html: email.html,
      });

      const deliveryMetadata = {
        ...metadata,
        delivery_email_sent_at: new Date().toISOString(),
        delivery_email_to: buyerEmail,
        delivery_email_result: deliveryResult,
      };

      await supabase
        .from("payments")
        .update({ metadata: deliveryMetadata })
        .eq("id", paymentId);

      return new Response(JSON.stringify({ success: true, channel: "email" }), { status: 200 });
    }

    // 2b. Nomination confirmation email
    if (payment.related_type === "nomination") {
      if (!payment.related_id) {
        console.error("send-delivery: nomination payment has no related_id yet", paymentId);
        return new Response(JSON.stringify({ success: true, channel: "none", skipped: "no_related_id" }), { status: 200 });
      }

      const { data: option, error: optionError } = await supabase
        .from("voting_options")
        .select("id, option_text, email, nominated_by_email, nominated_by_name, deletion_code, category_id, event_id")
        .eq("id", payment.related_id)
        .single();

      if (optionError || !option) {
        console.error("send-delivery: voting_option not found", { paymentId, relatedId: payment.related_id, optionError });
        return new Response(JSON.stringify({ success: true, channel: "none", skipped: "option_not_found" }), { status: 200 });
      }

      const recipientEmail = asString(option.nominated_by_email) ?? asString(option.email);
      if (!recipientEmail) {
        return new Response(JSON.stringify({ success: true, channel: "none", skipped: "no_recipient_email" }), { status: 200 });
      }

      const [{ data: category }, { data: event }] = await Promise.all([
        supabase.from("voting_categories").select("name").eq("id", option.category_id).single(),
        supabase.from("events").select("title").eq("id", option.event_id).single(),
      ]);

      const deletionCode = asString(option.deletion_code);
      const recipientName = asString(option.nominated_by_name) ?? recipientEmail;
      const nomineeName = asString(option.option_text) ?? "Nominee";
      const categoryName = asString(category?.name) ?? "this category";
      const eventName = asString(event?.title) ?? "this event";

      const subject = deletionCode
        ? `Your nomination for ${eventName} is live — exit key inside`
        : `Nomination received for ${eventName} — pending review`;

      const previewText = deletionCode
        ? `Nomination confirmed — keep your exit key safe`
        : `Nomination received — pending review`;

      const exitKeySection = deletionCode
        ? `<div style="background:#f4f4f5;border-radius:8px;padding:16px 20px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Your Exit Key (keep this safe)</p>
            <p style="margin:0;font-size:28px;font-weight:700;font-family:monospace;letter-spacing:0.15em;color:#18181b;">${deletionCode}</p>
          </div>
          <p style="color:#52525b;font-size:14px;">This 6-digit exit key is required if you ever need the nomination removed. Keep it safe — the event organizer will ask for it before they can delete the nomination.</p>`
        : `<p style="color:#52525b;font-size:14px;">Once approved, the nominee will appear in the public list. You will be notified if further action is needed.</p>`;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#f9fafb;font-family:sans-serif;margin:0;padding:40px 0;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <h1 style="font-size:22px;font-weight:700;color:#18181b;margin:0 0 8px;">Nomination ${deletionCode ? "Confirmed!" : "Received!"}</h1>
    <p style="color:#52525b;font-size:14px;">Hi ${recipientName},</p>
    <p style="color:#52525b;font-size:14px;">Your nomination of <strong>${nomineeName}</strong> for the <strong>${categoryName}</strong> category at <strong>${eventName}</strong> has been ${deletionCode ? "confirmed and is now live!" : "received and is pending review by the organizers."}</p>
    ${exitKeySection}
    <p style="color:#a1a1aa;font-size:12px;margin-top:32px;border-top:1px solid #f4f4f5;padding-top:16px;">Afrotix - Empowering African Events</p>
  </div>
</body></html>`;

      const deliveryResult = await sendEmail({ to: recipientEmail, subject, html });

      await supabase
        .from("payments")
        .update({
          metadata: {
            ...asRecord(payment.metadata),
            nomination_email_sent_at: new Date().toISOString(),
            nomination_email_to: recipientEmail,
          },
        })
        .eq("id", paymentId);

      console.info(`Nomination email sent to ${recipientEmail} for payment ${paymentId}`, deliveryResult);
      return new Response(JSON.stringify({ success: true, channel: "email" }), { status: 200 });
    }

    // 3. Legacy credit-based delivery path for other payment types
    const { data: organizer, error: organizerError } = payment.user_id
      ? await supabase
          .from("profiles")
          .select("id, utility_credits, whatsapp_opt_in")
          .eq("id", payment.user_id)
          .single()
      : { data: null, error: null };

    if (organizerError || !organizer) {
      console.warn(`No organizer profile found for payment ${paymentId}. Falling back to no-op delivery.`);
      return new Response(JSON.stringify({ success: true, channel: "none", skipped: "missing_profile" }), { status: 200 });
    }

    // 4. Determine Channel and Required Credits
    let channel = "email"; // Default
    let requiredCredits = 0;

    if (organizer.whatsapp_opt_in) {
      channel = "whatsapp";
      requiredCredits = 1.5;
    } else {
      channel = "sms";
      requiredCredits = 1.0;
    }

    // 5. Check Credits Balance
    if (organizer.utility_credits < requiredCredits) {
      console.warn(`Organizer ${organizer.id} has insufficient credits (${organizer.utility_credits}). Defaulting to email.`);
      channel = "email";
      requiredCredits = 0;
    }

    // 6. Deduct Credits if applicable
    if (requiredCredits > 0) {
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ utility_credits: organizer.utility_credits - requiredCredits })
        .eq("id", organizer.id);

      if (deductError) {
        console.error("Error deducting credits:", deductError);
        // Continue anyway or handle error
      }
    }

    // 7. SEND MESSAGE (Arkesel/Meta flow later)
    console.info(`Sending ${channel} delivery for payment ${paymentId}. Credits deducted: ${requiredCredits}`);

    return new Response(JSON.stringify({ success: true, channel, creditsDeducted: requiredCredits }), { status: 200 });

  } catch (err) {
    console.error("Delivery error:", err);
    return new Response("Internal Error", { status: 500 });
  }
});
