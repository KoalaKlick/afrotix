
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }



  // POST: resolve account as before
  try {
    // ...existing code...
    // JWT verification (optional, logs payload if present)
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("No Authorization header provided");
    } else {
      try {
        const jwt = authHeader.replace(/^Bearer /i, "");
        // Decode JWT payload for logging (not verifying signature here)
        const payload = jwt.split(".")[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        console.log("JWT payload:", decoded);
      } catch (jwtErr) {
        console.warn("Failed to decode JWT:", jwtErr);
      }
    }

    // Log and parse body
    let bodyRaw = await req.text();
    console.log("Raw request body:", bodyRaw);
    let body;
    try {
      body = JSON.parse(bodyRaw);
    } catch (parseErr) {
      console.error("Failed to parse JSON body:", parseErr);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: parseErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { accountNumber, bankCode } = body || {};

    if (!accountNumber || !bankCode) {
      console.warn("Missing required fields", { accountNumber, bankCode });
      return new Response(
        JSON.stringify({ error: "Missing required fields: accountNumber, bankCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paystackUrl = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
    console.log("Paystack URL:", paystackUrl);

    const response = await fetch(paystackUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    });

    const result = await response.json();
    console.log("Paystack response:", result);

    if (result.status) {
      return new Response(
        JSON.stringify({
          success: true,
          accountName: result.data.account_name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.message || "Could not resolve account. Please check the details.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("verify-account error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
