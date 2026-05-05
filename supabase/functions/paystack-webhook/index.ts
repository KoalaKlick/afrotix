import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// ─── Utility Functions ──────────────────────────────────────────────

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function updateTicketOrderStatus(supabase, payment) {
  return supabase
    .from("ticket_orders")
    .update({ status: "confirmed", payment_id: payment.id })
    .eq("id", payment.related_id);
}

async function createTicketOrderAndTickets(supabase, payment) {
  const metadata = payment?.metadata || {};
  const quantity = Number(metadata.quantity || 1);
  const eventId = metadata.event_id;
  const ticketTypeId = metadata.ticket_type_id || payment.related_id;

  // Use base amount (product price) for the order subtotal
  const { data: order, error: orderError } = await supabase
    .from("ticket_orders")
    .insert({
      event_id: eventId,
      order_number: `ORD-${crypto.randomUUID().split("-")[0].toUpperCase()}`,
      buyer_name: metadata.buyer_name || null,
      buyer_phone: metadata.buyer_phone || payment.email,
      subtotal: Number(payment.amount),
      status: "confirmed",
      payment_id: payment.id,
      user_id: payment.user_id,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order creation error:", orderError, {
      eventId,
      ticketTypeId,
      quantity,
      paymentId: payment.id,
    });
    return;
  }

  console.info("Order created successfully:", order);

  // Create N tickets
  const tickets = [];
  for (let i = 0; i < quantity; i++) {
    tickets.push({
      order_id: order.id,
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      ticket_code: `TKT-${crypto.randomUUID().split("-")[0].toUpperCase()}-${i}`,
      attendee_name: metadata.buyer_name || null,
      attendee_email: metadata.buyer_email || payment.email,
    });
  }

  console.info("Attempting to insert tickets:", tickets);
  const { error: tktError, data: insertedTickets } = await supabase
    .from("tickets")
    .insert(tickets)
    .select();

  if (tktError) {
    console.error("Tickets creation error:", tktError, { tickets });
  } else {
    console.info("Tickets created successfully:", insertedTickets);
  }

  // Increment ticket type quantity sold
  const { data: incResult, error: incError } = await supabase.rpc("increment_ticket_count", {
    type_id: ticketTypeId,
    qty: quantity
  });
  if (incError) {
    console.error("increment_ticket_count error:", incError, { ticketTypeId, quantity });
  } else {
    console.info("increment_ticket_count result:", incResult);
  }
}

async function createVote(supabase, payment) {
  const voteMetadata = payment?.metadata || {};
  const voteCount = Number(voteMetadata.vote_count || 1);
  const optionId = payment.related_id;
  const { data: vote, error: voteError } = await supabase
    .from("votes")
    .insert({
      payment_id: payment.id,
      vote_count: voteCount,
      event_id: voteMetadata.event_id,
      option_id: optionId,
      category_id: voteMetadata.category_id,
      voter_id: payment.user_id,
      voter_email: voteMetadata.voter_email || null,
      voter_phone: voteMetadata.voter_phone || null,
    })
    .select()
    .single();

  if (voteError) {
    console.error("Vote insert error:", voteError, {
      payment_id: payment.id,
      vote_count: voteCount,
      option_id: optionId,
    });
    throw new Error(`Failed to insert vote: ${JSON.stringify(voteError)}`);
  } else {
    await supabase.rpc("increment_vote_count", {
      opt_id: optionId,
      qty: voteCount
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────────

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  const rawBody = await req.text();

  // 1. Verify HMAC — reject unsigned requests
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expectedSig = createHmac("sha512", PAYSTACK_SECRET).update(rawBody).digest("hex");
  if (signature !== expectedSig) {
    console.error("Invalid signature");
    return new Response("Forbidden", { status: 403 });
  }

  const event = JSON.parse(rawBody);

  // 2. Only process successful charges
  if (event.event !== "charge.success") {
    return new Response("OK", { status: 200 });
  }

  const reference = event.data?.reference;
  if (!reference) return new Response("Missing reference", { status: 400 });

  const supabase = getSupabaseClient();

  // 3. Find the payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .single();

  if (!payment) {
    console.error("Unknown reference:", reference);
    return new Response("OK", { status: 200 }); // stop Paystack retrying
  }

  // 4. Idempotency — already completed
  if (payment.status === "completed") {
    return new Response("OK", { status: 200 });
  }

  // 5. Read fee breakdown from the payment record (set during initiate-payment)
  // No recalculation needed — fee_breakdown is the single source of truth.
  const fees = payment.fee_breakdown || {};
  const baseAmount = Number(fees.base_amount || payment.amount);
  const platformFee = Number(fees.platform_fee || 0);

  // 6. Confirm Payment — store Paystack's raw response for audit trail
  await supabase
    .from("payments")
    .update({
      status: "completed",
      verified_at: new Date().toISOString(),
      paystack_transaction_id: String(event.data.id ?? ""),
      provider_response: event,
    })
    .eq("id", payment.id);

  // 7. Referral Commission (funded from platform fee — never reduces organizer revenue)
  if (payment.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", payment.user_id)
      .single();

    if (profile?.referred_by) {
      const { data: promoter } = await supabase
        .from("promoters")
        .select("id, is_gold_tier")
        .eq("user_id", profile.referred_by)
        .single();

      if (promoter) {
        const commissionRate = promoter.is_gold_tier ? 0.15 : 0.10;
        const commissionAmount = platformFee * commissionRate;

        await supabase.from("commissions").insert({
          promoter_id: promoter.id,
          type: payment.related_type === "vote" ? "vote_purchase" : "ticket_purchase",
          amount: commissionAmount,
          base_amount: platformFee,
          commission_rate: commissionRate * 100,
          source_type: "payment",
          source_id: payment.id,
          status: "pending",
          description: `Commission from ${payment.related_type} transaction`
        });

        await supabase.rpc("increment_promoter_revenue", {
          p_id: promoter.id,
          amt: baseAmount
        });
      }
    }
  }

  // 8. Update Related Entities
  if (payment.related_type === "ticket_order") {
    await updateTicketOrderStatus(supabase, payment);
  } else if (payment.related_type === "ticket") {
    await createTicketOrderAndTickets(supabase, payment);
  } else if (payment.related_type === "vote") {
    await createVote(supabase, payment);
  }

  // 9. Trigger delivery (Arkesel/WhatsApp)
  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
    },
    body: JSON.stringify({ paymentId: payment.id })
  }).catch(err => console.error("Error triggering send-delivery:", err));

  console.info(`Payment ${payment.id} processed. Base: ${baseAmount}, Platform fee: ${platformFee}`);

  return new Response("OK", { status: 200 });
});
