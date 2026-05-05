import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Pricing Constants (mirrored from lib/const/pricing.ts) ──────────────────
// The percentage_charge on the subaccount tells Paystack how much to keep for
// the platform on every split transaction.

const PLATFORM_PERCENTAGE_CHARGE = 0; // We handle fees dynamically in the initialization hook


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

    // 1. Authenticate
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const {
      organizationId,
      businessName,
      accountNumber,
      bankCode,
      accountName,
    } = await req.json();

    if (!organizationId || !accountNumber || !bankCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: organizationId, accountNumber, bankCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify user is admin/owner of the organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "You must be an admin or owner of this organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if org already has a subaccount
    const { data: org } = await supabase
      .from("organizations")
      .select("subaccount_code")
      .eq("id", organizationId)
      .single();

    if (org?.subaccount_code) {
      // Already has a subaccount — try updating it
      const updateResponse = await updateSubaccount(supabase, {
        subaccountCode: org.subaccount_code,
        organizationId,
        accountNumber,
        bankCode,
        accountName,
        businessName,
      });

      const updateData = await updateResponse.clone().json();

      // If subaccount is not found on Paystack (stale data in DB), 
      // proceed to create a new one instead of failing.
      if (
        updateData.code === "not_found" || 
        updateData.detail?.toLowerCase().includes("not found") ||
        updateData.message?.toLowerCase().includes("not found")
      ) {
        console.warn(`Subaccount ${org.subaccount_code} not found on Paystack. Falling back to creation.`);
      } else {
        return updateResponse;
      }
    }

    // 4. Use account number exactly as passed
    const finalAccountNumber = accountNumber;

    // 5. Create Paystack subaccount
    
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName || `Org-${organizationId.substring(0, 8)}`,
        account_number: finalAccountNumber,
        percentage_charge: PLATFORM_PERCENTAGE_CHARGE,
        settlement_bank: bankCode,
        primary_contact_email: user.email,
      }),
    });

    const paystackData = await paystackRes.json();
    console.log("Paystack response:", paystackData);

    if (!paystackRes.ok || !paystackData.status) {
      console.error("Paystack subaccount creation failed:", paystackData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create payment account",
          detail: paystackData.message || "Unknown Paystack error",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subaccountCode = paystackData.data?.subaccount_code;
    if (!subaccountCode) {
      return new Response(
        JSON.stringify({ success: false, error: "No subaccount code returned from Paystack" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Store subaccount details on the organization
    const { error: dbError } = await supabase
      .from("organizations")
      .update({
        subaccount_code: subaccountCode,
        paystack_bank_code: bankCode,
        paystack_account_number: finalAccountNumber,
        paystack_account_name: accountName || paystackData.data.settlement_bank || "Verified Account",
      })
      .eq("id", organizationId);

    if (dbError) {
      console.error("Database update failed:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Subaccount created on Paystack but failed to save to database", detail: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(
      `Subaccount ${subaccountCode} created for org ${organizationId} (${businessName})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        subaccountCode,
        message: "Payment account created successfully. Payouts will be sent automatically.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("create-subaccount error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helper: Update existing subaccount ─────────────────────────────────────

async function updateSubaccount(
  supabase: ReturnType<typeof createClient>,
  params: {
    subaccountCode: string;
    organizationId: string;
    accountNumber: string;
    bankCode: string;
    accountName?: string;
    businessName?: string;
  }
) {
  const finalAccountNumber = params.accountNumber;

  // Update on Paystack
  const paystackRes = await fetch(
    `https://api.paystack.co/subaccount/${params.subaccountCode}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        settlement_bank: params.bankCode,
        account_number: finalAccountNumber,
        ...(params.businessName && { business_name: params.businessName }),
        percentage_charge: PLATFORM_PERCENTAGE_CHARGE,
      }),
    }
  );

  const paystackData = await paystackRes.json();
  console.log("Paystack update response:", paystackData);

  if (!paystackRes.ok || !paystackData.status) {
    console.error("Paystack subaccount update failed:", paystackData);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to update payment account",
        detail: paystackData.message || "Unknown Paystack error",
        code: paystackData.code,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update locally
  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      paystack_bank_code: params.bankCode,
      paystack_account_number: finalAccountNumber,
      paystack_account_name: params.accountName || null,
    })
    .eq("id", params.organizationId);

  if (dbError) {
    console.error("Database update failed (update flow):", dbError);
    return new Response(
      JSON.stringify({ success: false, error: "Subaccount updated on Paystack but failed to save to database", detail: dbError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.info(
    `Subaccount ${params.subaccountCode} updated for org ${params.organizationId}`
  );

  return new Response(
    JSON.stringify({
      success: true,
      subaccountCode: params.subaccountCode,
      message: "Payment account updated successfully.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
