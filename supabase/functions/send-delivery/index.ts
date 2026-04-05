import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildTicketPurchaseEmail } from "../_shared/email-templates.ts";

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
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "tickets@updates.afrotix.co";

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured. Skipping email send.");
    return { skipped: true, reason: "missing_resend_api_key" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Resend send failure:", payload);
    throw new Error(`Email send failed: ${response.status}`);
  }

  return payload;
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
    if (payment.related_type === "ticket_order" && payment.related_id) {
      const metadata = asRecord(payment.metadata);

      const { data: order, error: orderError } = await supabase
        .from("ticket_orders")
        .select("id, event_id, order_number, buyer_name, buyer_phone, subtotal")
        .eq("id", payment.related_id)
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
      const fallbackSourcePath = asString(metadata.source_path);
      const fallbackTicketUrl = appUrl && fallbackSourcePath ? `${appUrl}${fallbackSourcePath}` : null;
      const ticketUrlsFromMetadata = asStringArray(metadata.ticket_urls);
      const ticketUrls = ticketUrlsFromMetadata.length
        ? ticketUrlsFromMetadata
        : fallbackTicketUrl
          ? (tickets ?? []).map(() => fallbackTicketUrl)
          : [];

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
