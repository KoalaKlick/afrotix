import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Pricing Constants (mirrored from lib/const/pricing.ts for Deno edge runtime) ─
// These MUST stay in sync with the frontend constants file.
// Edge functions can't import from the Next.js project directly.

const PLATFORM_FEES = {
  vote:       { percentage: 0.035, fixed: 0   },
  nomination: { percentage: 0.035, fixed: 0   },
  ticket:     { percentage: 0.035, fixed: 1.0 },
} as const;

type TxnType = keyof typeof PLATFORM_FEES;

function toPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

// ──────────────────────────────────────────────────────────────────────────────

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

    // 1. Authenticate user (optional but recommended)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let user = null;
    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    const { 
      amount, 
      email, 
      phone,
      currency = "GHS", 
      purpose, 
      relatedType, 
      relatedId,
      organizationId,
      metadata = {} 
    } = await req.json();

    if (!amount || !email || !purpose) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Generate a unique reference
    const reference = `PAY-${crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase()}`;

    // 3. Create PENDING payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user?.id || null,
        email,
        amount,
        currency,
        purpose,
        related_type: relatedType,
        related_id: relatedId,
        reference,
        status: "pending",
        provider: "paystack",
        metadata: { ...metadata, reference }
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment creation error:", paymentError);
      throw paymentError;
    }

    // 4. Look up the organization's Paystack subaccount (if exists)
    let subaccountCode: string | null = null;
    if (organizationId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("subaccount_code")
        .eq("id", organizationId)
        .single();
      
      subaccountCode = org?.subaccount_code ?? null;
    }

    // 5. Calculate platform fee for the split
    const txnType: TxnType = (purpose === "vote" || purpose === "nomination" || purpose === "ticket")
      ? purpose 
      : "ticket"; // Default to ticket fees for unknown types
    
    const feeConfig = PLATFORM_FEES[txnType];
    const platformFee = (Number(amount) * feeConfig.percentage) + feeConfig.fixed;

    // 6. Build Paystack payload
    const callbackUrl = metadata?.callback_url || Deno.env.get("APP_URL") 
      ? `${Deno.env.get("APP_URL")}/payment/callback` 
      : undefined;

    const paystackPayload: Record<string, unknown> = {
      email,
      amount: toPesewas(Number(amount)),
      currency,
      reference,
      phone: phone?.startsWith("0") ? "+233" + phone.slice(1) : phone,
      customer: { email, phone },
      ...(callbackUrl && { callback_url: callbackUrl }),
      metadata: {
        payment_id: payment.id,
        phone,
        mobile_number: phone,
        related_type: relatedType,
        related_id: relatedId,
        platform_fee: platformFee,
        txn_type: txnType,
        ...metadata,
        custom_fields: [
          ...(metadata?.custom_fields || []),
          {
            display_name: "Payer Number",
            variable_name: "phone",
            value: phone
          }
        ]
      },
    };

    // 7. If organization has a Paystack subaccount, add split params
    if (subaccountCode) {
      paystackPayload.subaccount = subaccountCode;
      paystackPayload.bearer = "subaccount"; // Organizer absorbs Paystack processing fee
      
      // For percentage-based splits, Paystack uses percentage_charge on the subaccount.
      // For fixed + percentage, we use transaction_charge for the fixed component.
      if (feeConfig.fixed > 0) {
        paystackPayload.transaction_charge = toPesewas(platformFee);
      }
    }

    // 8. Initialize Paystack Transaction
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
        
      return new Response(JSON.stringify({ error: "Paystack initialization failed", detail: paystackData.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    return new Response(JSON.stringify({ error: "Internal Server Error", message: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
