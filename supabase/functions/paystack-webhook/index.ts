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

async function handleNominationPayment(supabase, payment) {
  const optionId = payment.related_id;

  if (optionId) {
    // ── Legacy / pre-existing record path: just update status ─────────────
    const { data: option } = await supabase
      .from("voting_options")
      .select("id, category_id")
      .eq("id", optionId)
      .single();

    if (!option) {
      console.error("Nomination option not found:", optionId);
      return;
    }

    const { data: category } = await supabase
      .from("voting_categories")
      .select("require_approval")
      .eq("id", option.category_id)
      .single();

    const newStatus = category?.require_approval === false ? "approved" : "pending";
    const deletionCode = newStatus === "approved"
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : null;

    const updatePayload: Record<string, string> = { status: newStatus };
    if (deletionCode) updatePayload.deletion_code = deletionCode;

    const { error } = await supabase
      .from("voting_options")
      .update(updatePayload)
      .eq("id", optionId);

    if (error) {
      console.error("Failed to update nomination status:", error, { optionId, newStatus });
    } else {
      console.info(`Nomination ${optionId} status set to ${newStatus} after payment ${payment.id}`);
    }
    return;
  }

  // ── New path: create nomination record from payment metadata ─────────────
  // This is the correct flow: form → payment dialog → Paystack → webhook creates record
  const metadata = payment?.metadata || {};
  const categoryId = metadata.category_id;
  const eventId = metadata.event_id;

  if (!categoryId || !eventId || !metadata.nominee_name) {
    console.error("Missing required nomination metadata:", { categoryId, eventId, nomineeName: metadata.nominee_name });
    return;
  }

  const { data: category } = await supabase
    .from("voting_categories")
    .select("require_approval")
    .eq("id", categoryId)
    .single();

  const newStatus = category?.require_approval === false ? "approved" : "pending";
  const deletionCode = newStatus === "approved"
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : null;

  // Generate a nominee code: first 3 consonant/alpha chars of name + 3-digit sequence
  async function generateCode(): Promise<string> {
    const raw = String(metadata.nominee_name).trim().toUpperCase().replace(/[^A-Z]/g, "");
    const prefix = raw.substring(0, 3).padEnd(3, "X");
    const { data: existing } = await supabase
      .from("voting_options")
      .select("nominee_code")
      .eq("event_id", eventId)
      .ilike("nominee_code", `${prefix}%`);
    let max = 0;
    const re = new RegExp(`^${prefix}(\\d+)$`);
    for (const row of (existing || [])) {
      if (row.nominee_code) {
        const m = re.exec(row.nominee_code);
        if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
      }
    }
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  }

  const nomineeCode = await generateCode().catch(() => `NOM${Date.now().toString().slice(-6)}`);

  const insertData: Record<string, unknown> = {
    event_id: eventId,
    category_id: categoryId,
    option_text: metadata.nominee_name,
    email: metadata.nominee_email ?? null,
    description: metadata.nominee_description ?? null,
    image_url: metadata.nominee_image_url ?? null,
    nominated_by_email: metadata.nominator_email ?? null,
    nominated_by_name: metadata.nominator_name ?? null,
    status: newStatus,
    is_public_nomination: true,
    nominee_code: nomineeCode,
  };
  if (deletionCode) insertData.deletion_code = deletionCode;

  const { data: newOption, error: insertError } = await supabase
    .from("voting_options")
    .insert(insertData)
    .select("id")
    .single();

  if (insertError || !newOption) {
    console.error("Failed to create nomination from payment metadata:", insertError);
    return;
  }

  console.info(`Nomination created from payment ${payment.id}: optionId=${newOption.id}, status=${newStatus}`);

  // Insert custom field values if any
  const fieldValues: { fieldId: string; value: string }[] = metadata.field_values ?? [];
  if (fieldValues.length > 0) {
    const rows = fieldValues.map((fv) => ({
      option_id: newOption.id,
      field_id: fv.fieldId,
      value: fv.value,
    }));
    const { error: fvError } = await supabase.from("voting_option_field_values").insert(rows);
    if (fvError) console.error("Failed to insert field values:", fvError);
  }

  // Link the payment record to the new option so send-delivery can look it up
  await supabase.from("payments").update({ related_id: newOption.id }).eq("id", payment.id);
  // Also update in-memory so the delivery call below sees the correct related_id
  payment.related_id = newOption.id;
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

  // 6b. Wallet and Transaction Update
  const orgId = payment.metadata?.organization_id;
  if (orgId) {
    let { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    if (!wallet) {
      const { data: newWallet, error: newWalletError } = await supabase
        .from("wallets")
        .insert({
          organization_id: orgId,
          balance: 0,
          total_credits: 0,
          currency: payment.currency || "GHS",
        })
        .select()
        .single();
        
      if (newWalletError) {
        console.error("Wallet creation error:", newWalletError);
      }
      wallet = newWallet;
    }

    if (wallet) {
      const isSplit = fees.is_split === true;
      const organizerReceives = Number(fees.organizer_receives || baseAmount - platformFee);
      
      // If the payment was automatically split to a Paystack subaccount, 
      // the funds don't sit in our wallet balance. We only update total_credits.
      const balanceIncrement = isSplit ? 0 : organizerReceives;
      
      const newBalance = Number(wallet.balance) + balanceIncrement;
      const newTotalCredits = Number(wallet.total_credits || 0) + organizerReceives;

      const { data: txn, error: txnError } = await supabase
        .from("transactions")
        .insert({
          reference: `TXN-${crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase()}`,
          wallet_id: wallet.id,
          type: "credit",
          category: payment.related_type === "vote" ? "vote_purchase" : "ticket_purchase",
          status: "completed",
          amount: organizerReceives,
          currency: payment.currency || "GHS",
          fee_amount: platformFee,
          fee_breakdown: fees,
          balance_before: wallet.balance,
          balance_after: newBalance,
          description: `Revenue from ${payment.related_type}`,
          related_type: payment.related_type,
          related_id: payment.related_id,
          payment_id: payment.id,
          provider_reference: String(event.data?.reference || payment.reference),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txn) {
        await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            total_credits: newTotalCredits,
            last_transaction_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);
      } else {
        console.error("Transaction creation error:", txnError);
      }
    }
  }

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
  } else if (payment.related_type === "nomination") {
    await handleNominationPayment(supabase, payment);
  }

  // 9. Trigger delivery (Next.js API route)
  // Fallback to the production domain if APP_URL is missing in edge secrets
  const rawAppUrl = Deno.env.get("APP_URL") || Deno.env.get("NEXT_PUBLIC_DOMAIN_URL") || "https://afrotix.vercel.app";
  const appUrl = rawAppUrl.replace(/\/$/, "");
  
  fetch(`${appUrl}/api/webhooks/send-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // We can pass a secret header here if needed to secure the API route in the future
    },
    body: JSON.stringify({ paymentId: payment.id })
  }).catch(err => console.error("Error triggering send-delivery API:", err));


  console.info(`Payment ${payment.id} processed. Base: ${baseAmount}, Platform fee: ${platformFee}`);

  return new Response("OK", { status: 200 });
});
