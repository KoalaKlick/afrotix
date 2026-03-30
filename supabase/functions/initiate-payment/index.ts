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

    // --- Pre-flight Constraint Checks (Logged-in Only + Private Events) ---
    if (user && relatedType === "vote") {
      const categoryId = metadata?.category_id;
      const eventId = metadata?.event_id;
      const optionId = relatedId;

      if (eventId && categoryId) {
        // 1. Fetch Event Publicity & Category limits
        const { data: eventData } = await supabase
          .from("events")
          .select("is_public")
          .eq("id", eventId)
          .single();

        // ONLY enforce limits if the event is PRIVATE (is_public === false)
        // If it is missing, null, or true, default to PUBLIC
        if (eventData && eventData.Internal) {
          const { data: category } = await supabase
            .from("voting_categories")
            .select("max_votes_per_user, max_nominees_per_user")
            .eq("id", categoryId)
            .single();

          if (category) {
            // 2. Check if already voted for this specific nominee (Duplicate Transaction)
            const { data: existingNomineeVote } = await supabase
              .from("votes")
              .select("id")
              .eq("option_id", optionId)
              .eq("voter_id", user.id)
              .single();

            if (existingNomineeVote) {
               return new Response(JSON.stringify({ 
                 error: "Already Voted", 
                 detail: "You have already cast your ballot for this nominee in this private event." 
               }), {
                 status: 403, 
                 headers: { ...corsHeaders, "Content-Type": "application/json" },
               });
            }

            // 3. Check if they've exceeded the 'max nominees' allowed in this category
            const { count: nomineeCount } = await supabase
              .from("votes")
              .select("id", { count: "exact", head: true })
              .eq("category_id", categoryId)
              .eq("voter_id", user.id);

            if (nomineeCount && nomineeCount >= category.max_nominees_per_user) {
              return new Response(JSON.stringify({ 
                error: "Nominee Limit Reached", 
                detail: `You have already voted for the maximum allowed (${category.max_nominees_per_user}) nominees in this private category.` 
              }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        }
      }
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
