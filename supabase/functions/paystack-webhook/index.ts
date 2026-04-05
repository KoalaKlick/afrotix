import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// ─── Utility Functions ──────────────────────────────────────────────
function getPaymentMetadata(payment) {
  return payment?.metadata || {};
}

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
  const metadata = getPaymentMetadata(payment);
  const quantity = Number(metadata.quantity || 1);
  const eventId = metadata.event_id;
  const ticketTypeId = metadata.ticket_type_id || payment.related_id;
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
      metadata
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
  const voteMetadata = getPaymentMetadata(payment);
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

// ─── Pricing Constants (mirrored from lib/const/pricing.ts for Deno edge runtime) ─
// These MUST stay in sync with the frontend constants file.

const PLATFORM_FEES = {
  vote: { percentage: 0.035, fixed: 0 },
  nomination: { percentage: 0.035, fixed: 0 },
  ticket: { percentage: 0.035, fixed: 1.0 },
} as const;

type TxnType = keyof typeof PLATFORM_FEES;

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

  // 5. Verify amount (subunits to decimal)
  const paidAmount = event.data.amount / 100;
  if (Math.abs(paidAmount - Number(payment.amount)) > 0.01) {
    console.warn(`Amount mismatch: expected ${payment.amount}, got ${paidAmount}`);
  }

  // 6. Calculate Platform Fee using centralized constants
  const txnType: TxnType = (payment.metadata?.txn_type as TxnType) || "ticket";
  const feeConfig = PLATFORM_FEES[txnType];
  const amount = Number(payment.amount);
  const platformFee = (amount * feeConfig.percentage) + feeConfig.fixed;

  // 7. Confirm Payment
  await supabase
    .from("payments")
    .update({
      status: "completed",
      verified_at: new Date().toISOString(),
      paystack_transaction_id: String(event.data.id ?? ""),
      provider_response: event,
      metadata: {
        ...payment.metadata,
        platform_fee: platformFee,
        fee_type: txnType,
        fee_percentage: feeConfig.percentage,
        fee_fixed: feeConfig.fixed,
      }
    })
    .eq("id", payment.id);

  // 8. Referral Commission (if applicable)
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
          amt: amount
        });
      }
    }
  }

  // 9. Update Related Entities
  if (payment.related_type === "ticket_order") {
    await updateTicketOrderStatus(supabase, payment);
  } else if (payment.related_type === "ticket") {
    await createTicketOrderAndTickets(supabase, payment);
  } else if (payment.related_type === "vote") {
    await createVote(supabase, payment);
  }

  // 10. Trigger delivery (Arkesel/WhatsApp)
  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
    },
    body: JSON.stringify({ paymentId: payment.id })
  }).catch(err => console.error("Error triggering send-delivery:", err));

  console.info(`Payment ${payment.id} processed successfully. Fee: ${platformFee} GHS (${txnType})`);

  return new Response("OK", { status: 200 });
});
