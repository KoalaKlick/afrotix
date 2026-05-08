import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Pricing Constants (mirrored from lib/const/pricing.ts) ─────────────────
const PLATFORM_FEES = {
  vote: { percentage: 0.065, fixed: 0 },
  nomination: { percentage: 0.0, fixed: 0.5 },
  ticket: { percentage: 0.05, fixed: 0.5 },
} as const;

type TxnType = keyof typeof PLATFORM_FEES;

// Paystack Ghana: 1.95%, capped at GHS 100 for local cards.
// For international cards it's 3.9% + GHS 1 — but we target GHS only.
const PAYSTACK_FEE_RATE = 0.0195;
const PAYSTACK_FEE_CAP = 100; // GHS

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate the amount to charge the customer so that after Paystack deducts
 * its own fee (1.95%, capped at GHS 100), we receive *exactly* baseAmount.
 *
 * Paystack fee on the charged amount X:
 *   paystackFee = min(X * 0.0195, 100)
 *
 * We want:  X - paystackFee = baseAmount
 *
 * Case 1 — fee is NOT capped (most transactions):
 *   X - X * 0.0195 = baseAmount
 *   X = baseAmount / (1 - 0.0195)
 *   → use this when X * 0.0195 < 100  (i.e. X < ~5128.21)
 *
 * Case 2 — fee IS capped at 100:
 *   X - 100 = baseAmount
 *   X = baseAmount + 100
 *   → use when baseAmount > ~5028.21
 *
 * We compute both and pick the right branch.
 */
function computeChargeAmount(baseAmount: number): {
  totalToCharge: number;
  paystackFee: number;
} {
  // Case 1: uncapped
  const uncappedCharge = baseAmount / (1 - PAYSTACK_FEE_RATE);
  const uncappedFee = round2(uncappedCharge * PAYSTACK_FEE_RATE);

  if (uncappedFee <= PAYSTACK_FEE_CAP) {
    // Normal path — fee is within cap
    return {
      totalToCharge: round2(uncappedCharge),
      paystackFee: uncappedFee,
    };
  }

  // Case 2: fee would exceed cap, so Paystack only takes GHS 100
  return {
    totalToCharge: round2(baseAmount + PAYSTACK_FEE_CAP),
    paystackFee: PAYSTACK_FEE_CAP,
  };
}

// ────────────────────────────────────────────────────────────────────────────

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      amount,
      email,
      phone,
      currency = "GHS",
      purpose,
      relatedType,
      relatedId,
      organizationId,
      metadata = {},
    } = await req.json();

    if (!amount || !email || !purpose) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Authenticate user (optional).
    //    Public payment flows (votes, nominations) are anonymous — user_id is
    //    intentionally null even when a session JWT is present in the request.
    const PUBLIC_RELATED_TYPES = ["vote", "nomination"];
    const isPublicFlow = PUBLIC_RELATED_TYPES.includes(relatedType ?? "");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let user = null;
    if (token && !isPublicFlow) {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    // 2. Generate reference
    const reference = `PAY-${crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase()}`;

    // 3. Fee calculations
    // Use relatedType ("vote", "nomination", "ticket") — NOT purpose, which is
    // a free-text description like "Vote for John" and would fall through to "ticket"
    // fees (5% + GHS 0.5 fixed), breaking split math for low-value votes.
    const txnType: TxnType = (relatedType === "vote" || relatedType === "nomination" || relatedType === "ticket")
      ? relatedType
      : "ticket";

    const feeConfig = PLATFORM_FEES[txnType];
    const baseAmount = Number(amount);

    // What the customer actually pays — inflated so Paystack's cut comes from
    // the surcharge, leaving baseAmount intact on our side.
    // Guard: if base amount is zero (e.g. free nomination), skip fees entirely
    const { totalToCharge, paystackFee } = baseAmount === 0
      ? { totalToCharge: 0, paystackFee: 0 }
      : computeChargeAmount(baseAmount);

    // Platform fee is taken from baseAmount (organizer's gross).
    // Fixed component is skipped when amount is zero.
    const platformFee = baseAmount === 0
      ? 0
      : round2((baseAmount * feeConfig.percentage) + feeConfig.fixed);
    const organizerReceives = round2(baseAmount - platformFee);

    // 4. Look up org subaccount
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId && metadata?.event_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("organization_id")
        .eq("id", metadata.event_id)
        .single();
      if (eventData) resolvedOrgId = eventData.organization_id;
    }

    let subaccountCode: string | null = null;
    if (resolvedOrgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("subaccount_code")
        .eq("id", resolvedOrgId)
        .single();
      subaccountCode = org?.subaccount_code ?? null;
    }

    const feeBreakdown = {
      base_amount: baseAmount,
      platform_fee: platformFee,
      paystack_fee: paystackFee,       // borne by customer via surcharge
      total_charged: totalToCharge,     // what customer sees
      organizer_receives: organizerReceives,
      txn_type: txnType,
      is_split: !!subaccountCode,
    };

    // 5. Create PENDING payment record — amount = base product price
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user?.id || null,
        email,
        amount: baseAmount,
        currency,
        purpose,
        related_type: relatedType,
        related_id: relatedId,
        reference,
        status: "pending",
        provider: "paystack",
        fee_breakdown: feeBreakdown,
        metadata: { ...metadata, reference, organization_id: resolvedOrgId },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment creation error:", paymentError);
      return new Response(
        JSON.stringify({ error: "Unable to create payment record. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Build Paystack payload
    //    amount = totalToCharge (base + Paystack surcharge) — customer pays this.
    const formattedPhone = phone?.startsWith("0") ? "+233" + phone.slice(1) : phone;
    const callbackUrl = Deno.env.get("APP_URL")
      ? `${Deno.env.get("APP_URL")}/payment/callback`
      : metadata?.callback_url;

    const paystackPayload: Record<string, unknown> = {
      email,
      amount: toPesewas(totalToCharge), // customer-facing amount (includes surcharge)
      currency,
      reference,
      ...(formattedPhone && { phone: formattedPhone }),
      ...(callbackUrl && { callback_url: callbackUrl }),
      metadata: {
        payment_id: payment.id,
        ...metadata,
        custom_fields: [
          ...(metadata?.custom_fields || []),
          ...(phone ? [{ display_name: "Payer Number", variable_name: "phone", value: phone }] : []),
        ],
      },
    };

    // 7. Split configuration (only when org has a subaccount)
    //
    //    We set bearer = "account" so Paystack deducts its fee from OUR
    //    platform account's share — which is exactly the surcharge we collected.
    //    The subaccount (organizer) receives: totalToCharge - platformFee - paystackFee
    //                                       = baseAmount - platformFee
    //                                       = organizerReceives  ✓
    //
    //    transaction_charge is what we keep for the platform (in pesewas).
    //    Paystack computes: organizer gets totalToCharge - transaction_charge,
    //    then deducts its fee from the platform's transaction_charge.
    //
    //    So we set transaction_charge = platformFee + paystackFee (pesewas),
    //    and bearer = "account" (platform absorbs Paystack's cut from that amount).
    //
    //    Net to organizer  = totalToCharge - (platformFee + paystackFee)
    //                      = (baseAmount + paystackFee) - platformFee - paystackFee
    //                      = baseAmount - platformFee
    //                      = organizerReceives  ✓
    //
    //    Net to platform   = platformFee + paystackFee - paystackFee
    //                      = platformFee  ✓
    //
    const splitCharge = toPesewas(platformFee + paystackFee);
    const totalPesewas = toPesewas(totalToCharge);
    // Only apply split when: subaccount exists, charge is positive, and
    // charge is strictly less than the total (Paystack validation requirement).
    if (subaccountCode && splitCharge > 0 && splitCharge < totalPesewas) {
      paystackPayload.subaccount = subaccountCode;
      paystackPayload.bearer = "account";                // platform absorbs Paystack fee
      paystackPayload.transaction_charge = splitCharge;              // platform's gross take
    }

    // 8. Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error("Paystack init error:", paystackData);
      await supabase
        .from("payments")
        .update({ status: "failed", provider_response: paystackData })
        .eq("id", payment.id);

      // Map known Paystack error codes to user-friendly messages
      const paystackMsg: string = paystackData.message ?? "";
      let userMessage = "Payment could not be started. Please try again.";
      if (paystackData.code === "invalid_params" && paystackMsg.toLowerCase().includes("split")) {
        userMessage = "Payment setup error. Please contact support.";
      } else if (paystackMsg) {
        userMessage = paystackMsg;
      }

      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        reference,
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});