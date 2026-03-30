import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      metadata = {} 
    } = await req.json();

    if (!amount || !email || !purpose) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No pre-flight constraint checks for general voting since it has no maximum limits and allows multiple votes.

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

    // 4. Initialize Paystack Transaction
    const callbackUrl = metadata?.callback_url || Deno.env.get("APP_URL") 
      ? `${Deno.env.get("APP_URL")}/payment/callback` 
      : undefined;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100), // convert to subunits (pesewas/kobo)
        currency,
        reference,
        phone: phone.startsWith("0") ? "+233" + phone.slice(1) : phone, // Root-level phone for V2 pre-fill
        customer: {
          email,
          phone: phone, // Standard customer phone
        },
        ...(callbackUrl && { callback_url: callbackUrl }),
        metadata: {
          payment_id: payment.id,
          phone: phone, // Standard pre-fill
          mobile_number: phone, // Specific for some GH providers
          related_type: relatedType,
          related_id: relatedId,
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
      }),
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
    return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
