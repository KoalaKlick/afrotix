import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

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
    // Optional: Log mismatch but continue or fail
  }

  // 6. Confirm Payment & Calculate Fees
  const { data: profile } = await supabase
    .from("profiles")
    .select("pricing_plan, referred_by_id")
    .eq("id", payment.user_id)
    .single();

  const plan = profile?.pricing_plan || "essential";
  const amount = Number(payment.amount);

  // Platform Fee Logic: Essential (3.5% + 10) | Professional (1.5% + 5)
  const feePercentage = plan === "professional" ? 0.015 : 0.035;
  const fixedFee = plan === "professional" ? 5 : 10;
  const platformFee = (amount * feePercentage) + fixedFee;

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
        organizer_plan: plan
      }
    })
    .eq("id", payment.id);

  // 7. Handle Commissions (If referred)
  if (profile?.referred_by_id) {
    const { data: promoter } = await supabase
      .from("promoters")
      .select("id, is_gold_tier")
      .eq("user_id", profile.referred_by_id)
      .single();

    if (promoter) {
      // Reward is 10% or 15% of the Platform Fee
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

      // Update promoter's total revenue generated
      await supabase.rpc("increment_promoter_revenue", {
        p_id: promoter.id,
        amt: amount
      });
    }
  }

  // 8. Update Related Entities
  if (payment.related_type === "ticket_order") {
    await supabase
      .from("ticket_orders")
      .update({ status: "confirmed", paid_at: new Date().toISOString() })
      .eq("id", payment.related_id);
  }

  if (payment.related_type === "vote") {
    const voteMetadata = payment.metadata || {};
    const voteCount = Number(voteMetadata.vote_count || 1);
    const optionId = payment.related_id;

    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .insert({
        event_id: voteMetadata.event_id,
        option_id: optionId,
        category_id: voteMetadata.category_id,
        voter_id: payment.user_id,
        voter_email: payment.email,
        amount_paid: payment.amount,
        payment_reference: reference,
        payment_id: payment.id,
      })
      .select()
      .single();

    if (voteError) {
      console.error("Vote insert error:", voteError, {
        event_id: voteMetadata.event_id,
        option_id: optionId,
        category_id: voteMetadata.category_id,
        voter_id: payment.user_id,
        voter_email: payment.email,
        amount_paid: payment.amount,
        payment_reference: reference,
        payment_id: payment.id,
      });
    } else {
      await supabase.rpc("increment_vote_count", {
        opt_id: optionId,
        qty: voteCount
      });
    }
  }

  // 8. Trigger delivery (Arkesel/WhatsApp flow later)
  // We use EdgeRuntime.waitUntil to avoid blocking the webhook response
  // EdgeRuntime is only available in some environments, for Supabase we can use standard fetch
  // but we don't need to wait for it.

  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
    },
    body: JSON.stringify({ paymentId: payment.id })
  }).catch(err => console.error("Error triggering send-delivery:", err));

  console.info(`Payment ${payment.id} processed successfully.`);

  return new Response("OK", { status: 200 });
});
