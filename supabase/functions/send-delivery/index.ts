import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { paymentId } = await req.json();

    // 1. Fetch Payment and related Profile (Organizer)
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, profiles(*)")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) return new Response("Payment not found", { status: 404 });

    const organizer = payment.profiles;
    if (!organizer) return new Response("Organizer not found", { status: 404 });

    // 2. Determine Channel and Required Credits
    let channel = "email"; // Default
    let requiredCredits = 0;

    if (organizer.whatsapp_opt_in) {
      channel = "whatsapp";
      requiredCredits = 1.5;
    } else {
      channel = "sms";
      requiredCredits = 1.0;
    }

    // 3. Check Credits Balance
    if (organizer.utility_credits < requiredCredits) {
      console.warn(`Organizer ${organizer.id} has insufficient credits (${organizer.utility_credits}). Defaulting to email.`);
      channel = "email";
      requiredCredits = 0;
    }

    // 4. Deduct Credits if applicable
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

    // 5. SEND MESSAGE (Arkesel/Meta flow later)
    console.info(`Sending ${channel} delivery for payment ${paymentId}. Credits deducted: ${requiredCredits}`);

    return new Response(JSON.stringify({ success: true, channel, creditsDeducted: requiredCredits }), { status: 200 });

  } catch (err) {
    console.error("Delivery error:", err);
    return new Response("Internal Error", { status: 500 });
  }
});
