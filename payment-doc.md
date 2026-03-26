# Event & Voting Platform — Implementation Guide
### For AI Code Agent | One Flow at a Time | Ghana
### Stack: Supabase · Paystack · Arkesel · WhatsApp Meta Cloud API

---

## Before You Start

### Confirmation channel rule — applies to every flow
```
payment.channel = "web"  AND  whatsapp_opt_in = false  →  SMS via Arkesel
payment.channel = "web"  AND  whatsapp_opt_in = true   →  WhatsApp message
payment.channel = "whatsapp"                           →  WhatsApp message
```

### Non-negotiable security rules
```
1. Frontend NEVER writes to payments, tickets, votes, or payouts directly
2. All payment writes go through Edge Functions using service_role key only
3. status = "confirmed" is ONLY set by the Paystack webhook — never the frontend
4. Every payment gets an idempotency key BEFORE calling Paystack
5. Paystack webhook MUST verify HMAC SHA-512 signature before doing anything
6. All secrets live in Supabase Vault — never in code or committed .env files
```

### Environment variables — set ALL before starting Flow 1
```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxx
supabase secrets set PAYSTACK_WEBHOOK_SECRET=your-paystack-webhook-secret
supabase secrets set ARKESEL_API_KEY=your-arkesel-api-key
supabase secrets set ARKESEL_SENDER_ID=YourBrand
supabase secrets set WHATSAPP_TOKEN=your-meta-access-token
supabase secrets set WHATSAPP_PHONE_ID=your-phone-number-id
supabase secrets set WHATSAPP_VERIFY_TOKEN=any-random-string-you-choose
supabase secrets set APP_URL=https://your-app.com
```

### Agent instruction
Implement one complete flow at a time. Run the "How to test" check at the end
of each flow before moving to the next. Do not start a new flow until the
previous one is confirmed working end-to-end.

---
---

# FLOW 1 — User registers and sets up their account

**What happens:** User signs up → profile created → they optionally tick
"Send confirmations via WhatsApp" → profile saved.

---

## 1A — Database

```sql
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text not null,
  phone              text unique not null,            -- E.164 format: +233XXXXXXXXX
  ghana_card_number  text,                            -- KYC: Ghana Card or Voter ID
  momo_number        text,                            -- Used for payouts
  momo_network       text check (momo_network in ('mtn','airteltigo','vodafone')),
  whatsapp_opt_in    boolean default false,           -- true = confirmations via WhatsApp
  kyc_verified       boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "users view own profile"   on public.profiles
  for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a blank profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 1B — Frontend: registration form

```tsx
// components/RegisterForm.tsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function RegisterForm() {
  const [form, setForm] = useState({
    full_name: "", phone: "", password: "", whatsapp_opt_in: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const phone = form.phone.startsWith("0")
      ? "+233" + form.phone.slice(1)
      : form.phone;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${phone.replace("+", "")}@placeholder.com`,
      password: form.password,
      options: { data: { full_name: form.full_name, phone } }
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    // Trigger auto-created the profile row — update it with full details
    await supabase.from("profiles").update({
      full_name: form.full_name,
      phone,
      whatsapp_opt_in: form.whatsapp_opt_in
    }).eq("id", authData.user!.id);

    setLoading(false);
  }

  return (
    <div>
      <input placeholder="Full name" value={form.full_name}
        onChange={e => setForm({ ...form, full_name: e.target.value })} />
      <input placeholder="Phone (e.g. 0244123456)" value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input type="password" placeholder="Password" value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })} />
      <label>
        <input type="checkbox" checked={form.whatsapp_opt_in}
          onChange={e => setForm({ ...form, whatsapp_opt_in: e.target.checked })} />
        Send my confirmations via WhatsApp instead of SMS
      </label>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>
    </div>
  );
}
```

## 1C — How to test Flow 1

```
1. Register a new user via the form
2. Check Supabase → Authentication → Users — new user appears
3. Check Supabase → Table Editor → profiles — matching row appears
4. Confirm phone is stored in E.164 format (+233XXXXXXXXX)
5. Toggle whatsapp_opt_in on and off — confirm it saves correctly
✓ Flow 1 complete — move to Flow 2
```

---
---

# FLOW 2 — Organiser creates an event

**What happens:** Logged-in organiser fills event details → event saved as
`draft` → organiser publishes → status becomes `active`.

---

## 2A — Database

```sql
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  organiser_id     uuid references public.profiles(id) not null,
  event_date       timestamptz,
  venue            text,
  ticket_price     numeric(10,2) default 0,
  ticket_quantity  integer,                       -- null = unlimited
  tickets_sold     integer default 0,
  voting_enabled   boolean default false,
  vote_price       numeric(10,2) default 1.00,   -- GHS per vote
  voting_ends_at   timestamptz,
  status           text default 'draft'
                   check (status in ('draft','active','ended','cancelled')),
  created_at       timestamptz default now()
);

alter table public.events enable row level security;
create policy "anyone views active events"
  on public.events for select using (status = 'active');
create policy "organisers manage own events"
  on public.events for all using (auth.uid() = organiser_id);

create table public.contestants (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade not null,
  name        text not null,
  bio         text,
  photo_url   text,
  total_votes integer default 0,
  created_at  timestamptz default now()
);

alter table public.contestants enable row level security;
create policy "anyone views contestants"
  on public.contestants for select using (true);
create policy "organisers manage own contestants"
  on public.contestants for all
  using (
    auth.uid() = (select organiser_id from public.events where id = event_id)
  );
```

## 2B — Frontend: create event form

```tsx
// components/CreateEventForm.tsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function CreateEventForm() {
  const [form, setForm] = useState({
    title: "", description: "", venue: "", event_date: "",
    ticket_price: "0", ticket_quantity: "",
    voting_enabled: false, vote_price: "1.00", voting_ends_at: ""
  });

  async function handleSubmit(publishNow: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: event, error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      venue: form.venue,
      event_date: form.event_date || null,
      ticket_price: parseFloat(form.ticket_price),
      ticket_quantity: form.ticket_quantity ? parseInt(form.ticket_quantity) : null,
      voting_enabled: form.voting_enabled,
      vote_price: parseFloat(form.vote_price),
      voting_ends_at: form.voting_ends_at || null,
      organiser_id: user.id,
      status: publishNow ? "active" : "draft"
    }).select().single();

    if (error) { console.error(error); return; }
    alert(`Event created! ID: ${event.id}`);
  }

  return (
    <div>
      <input placeholder="Event title" value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Description" value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })} />
      <input placeholder="Venue" value={form.venue}
        onChange={e => setForm({ ...form, venue: e.target.value })} />
      <input type="datetime-local" value={form.event_date}
        onChange={e => setForm({ ...form, event_date: e.target.value })} />
      <input placeholder="Ticket price (GHS)" value={form.ticket_price}
        onChange={e => setForm({ ...form, ticket_price: e.target.value })} />
      <input placeholder="Max tickets (blank = unlimited)" value={form.ticket_quantity}
        onChange={e => setForm({ ...form, ticket_quantity: e.target.value })} />
      <label>
        <input type="checkbox" checked={form.voting_enabled}
          onChange={e => setForm({ ...form, voting_enabled: e.target.checked })} />
        Enable voting
      </label>
      {form.voting_enabled && <>
        <input placeholder="Price per vote (GHS)" value={form.vote_price}
          onChange={e => setForm({ ...form, vote_price: e.target.value })} />
        <input type="datetime-local" value={form.voting_ends_at}
          onChange={e => setForm({ ...form, voting_ends_at: e.target.value })} />
      </>}
      <button onClick={() => handleSubmit(false)}>Save as draft</button>
      <button onClick={() => handleSubmit(true)}>Publish now</button>
    </div>
  );
}
```

## 2C — How to test Flow 2

```
1. Log in as an organiser
2. Create a draft event — check events table, status = "draft"
3. Publish an event — status = "active"
4. View the event as a different user — should succeed (public read)
5. Try editing as a different user — should be blocked by RLS
6. Add a contestant via Supabase table editor manually
✓ Flow 2 complete — move to Flow 3
```

---
---

# FLOW 3 — User buys a ticket on the web app

**What happens:** User selects event → enters MoMo number → clicks Pay →
Paystack sends MoMo prompt to their phone → user approves → Paystack calls
our webhook → ticket auto-generated → confirmation sent via SMS or WhatsApp.

---

## 3A — Database

```sql
-- Core payments table — written ONLY by Edge Functions
create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references public.profiles(id) not null,
  idempotency_key         text unique not null,
  type                    text not null check (type in ('ticket','vote')),
  amount                  numeric(10,2) not null,
  currency                text default 'GHS',
  phone                   text not null,
  network                 text check (network in ('mtn','airteltigo','vodafone','bank','card')),
  event_id                uuid references public.events(id),
  contestant_id           uuid references public.contestants(id),
  vote_quantity           integer default 1,
  channel                 text default 'web' check (channel in ('web','whatsapp','ussd')),
  paystack_reference      text unique,
  paystack_transaction_id text,
  status                  text default 'pending'
                          check (status in ('pending','confirmed','failed','refunded')),
  raw_webhook             jsonb,
  created_at              timestamptz default now(),
  confirmed_at            timestamptz
);

alter table public.payments enable row level security;
create policy "users view own payments" on public.payments
  for select using (auth.uid() = user_id);
-- NO insert or update policy — service_role only

-- Tickets — written ONLY by DB trigger
create table public.tickets (
  id             uuid primary key default gen_random_uuid(),
  payment_id     uuid references public.payments(id) unique not null,
  user_id        uuid references public.profiles(id) not null,
  event_id       uuid references public.events(id) not null,
  ticket_code    text unique not null,
  qr_payload     text unique not null,
  is_used        boolean default false,
  used_at        timestamptz,
  sms_sent       boolean default false,
  whatsapp_sent  boolean default false,
  created_at     timestamptz default now()
);

alter table public.tickets enable row level security;
create policy "users view own tickets" on public.tickets
  for select using (auth.uid() = user_id);
-- NO insert or update policy — service_role only

-- DB trigger: fires when payment status flips to "confirmed"
create or replace function handle_payment_confirmed()
returns trigger as $$
begin
  if NEW.status = 'confirmed' and OLD.status = 'pending' then

    if NEW.type = 'ticket' then
      insert into public.tickets (payment_id, user_id, event_id, ticket_code, qr_payload)
      values (
        NEW.id, NEW.user_id, NEW.event_id,
        'EVT-' || to_char(now(),'YYYY') || '-' ||
          upper(substring(gen_random_uuid()::text, 1, 6)),
        gen_random_uuid()::text
      );
      update public.events
        set tickets_sold = tickets_sold + 1 where id = NEW.event_id;

    elsif NEW.type = 'vote' then
      insert into public.votes (
        payment_id, user_id, event_id, contestant_id,
        phone, vote_count, amount_paid, channel, confirmed, confirmed_at
      ) values (
        NEW.id, NEW.user_id, NEW.event_id, NEW.contestant_id,
        NEW.phone, NEW.vote_quantity, NEW.amount, NEW.channel, true, now()
      );
      update public.contestants
        set total_votes = total_votes + NEW.vote_quantity
        where id = NEW.contestant_id;
    end if;

    perform pg_notify('payment_confirmed', row_to_json(NEW)::text);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_payment_confirmed
  after update on public.payments
  for each row execute function handle_payment_confirmed();
```

## 3B — Edge Function: `initiate-payment`

```typescript
// supabase/functions/initiate-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Authenticate user via JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authError } = await supabase.auth
      .getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const { type, eventId, contestantId, voteQuantity, phone, network, channel = "web" }
      = await req.json();

    // 2. Validate event
    const { data: event } = await supabase
      .from("events").select("*").eq("id", eventId).eq("status", "active").single();
    if (!event) return new Response("Event not found or inactive", { status: 404 });

    // 3. Guard: tickets sold out?
    if (type === "ticket" && event.ticket_quantity !== null)
      if (event.tickets_sold >= event.ticket_quantity)
        return new Response("Tickets sold out", { status: 400 });

    // 4. Guard: voting window closed?
    if (type === "vote" && event.voting_ends_at)
      if (new Date() > new Date(event.voting_ends_at))
        return new Response("Voting has ended", { status: 400 });

    const amount = type === "ticket"
      ? event.ticket_price
      : event.vote_price * (voteQuantity || 1);

    // 5. Generate idempotency key and Paystack reference
    const idempotencyKey = `${user.id}-${type}-${eventId}-${Date.now()}`;
    const paystackRef    = `REF-${crypto.randomUUID().replace(/-/g,"").substring(0,16).toUpperCase()}`;

    // 6. Create PENDING record BEFORE calling Paystack
    const { data: payment, error: paymentError } = await supabase
      .from("payments").insert({
        user_id: user.id,
        idempotency_key: idempotencyKey,
        type, amount, phone, network,
        event_id: eventId,
        contestant_id: type === "vote" ? contestantId : null,
        vote_quantity: type === "vote" ? (voteQuantity || 1) : 1,
        channel,
        paystack_reference: paystackRef,
        status: "pending"
      }).select().single();
    if (paymentError) throw paymentError;

    // 7. Call Paystack
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: `${phone.replace("+","")}@placeholder.com`,
        amount: Math.round(amount * 100),
        currency: "GHS",
        reference: paystackRef,
        channels: network === "card" ? ["card"] : ["mobile_money"],
        mobile_money: network !== "card" ? {
          phone,
          provider: network === "mtn" ? "mtn" : network === "vodafone" ? "vod" : "atl"
        } : undefined,
        metadata: { payment_id: payment.id, type, event_id: eventId, channel }
      })
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return new Response(
        JSON.stringify({ error: "Payment init failed", detail: paystackData.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: payment.id,
      reference: paystackRef,
      authorizationUrl: paystackData.data.authorization_url
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("initiate-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
```

## 3C — Edge Function: `paystack-webhook`

```typescript
// supabase/functions/paystack-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  const rawBody = await req.text();

  // 1. Verify HMAC — reject unsigned requests
  const signature   = req.headers.get("x-paystack-signature") ?? "";
  const expectedSig = createHmac("sha512", PAYSTACK_SECRET).update(rawBody).digest("hex");
  if (signature !== expectedSig) {
    console.error("Invalid signature");
    return new Response("Forbidden", { status: 403 });
  }

  const event = JSON.parse(rawBody);

  // 2. Only process successful charges
  if (event.event !== "charge.success")
    return new Response("OK", { status: 200 });

  const reference = event.data?.reference;
  if (!reference) return new Response("Missing reference", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 3. Find the payment
  const { data: payment } = await supabase
    .from("payments").select("*").eq("paystack_reference", reference).single();

  if (!payment) {
    console.error("Unknown reference:", reference);
    return new Response("OK", { status: 200 }); // stop Paystack retrying
  }

  // 4. Idempotency — already confirmed
  if (payment.status === "confirmed")
    return new Response("OK", { status: 200 });

  // 5. Verify amount — prevent partial payment attacks
  const paidAmount = event.data.amount / 100;
  if (Math.abs(paidAmount - payment.amount) > 0.01) {
    console.error(`Amount mismatch: expected ${payment.amount}, got ${paidAmount}`);
    await supabase.from("payments")
      .update({ status: "failed", raw_webhook: event }).eq("id", payment.id);
    return new Response("OK", { status: 200 });
  }

  // 6. Confirm — fires handle_payment_confirmed() trigger
  await supabase.from("payments").update({
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
    paystack_transaction_id: String(event.data.id ?? ""),
    raw_webhook: event
  }).eq("id", payment.id);

  // 7. Trigger delivery async
  EdgeRuntime.waitUntil(
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({ paymentId: payment.id })
    })
  );

  return new Response("OK", { status: 200 });
});
```

## 3D — Edge Function: `send-delivery`

Sends ticket or vote confirmation. Uses SMS for web users, WhatsApp for
WhatsApp users or users who ticked the opt-in checkbox.

```typescript
// supabase/functions/send-delivery/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ARKESEL_API_KEY   = Deno.env.get("ARKESEL_API_KEY")!;
const ARKESEL_SENDER    = Deno.env.get("ARKESEL_SENDER_ID")!;
const WHATSAPP_TOKEN    = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const APP_URL           = Deno.env.get("APP_URL")!;

serve(async (req) => {
  const { paymentId } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: payment } = await supabase
    .from("payments")
    .select("*, events(title), profiles(whatsapp_opt_in)")
    .eq("id", paymentId).single();

  if (!payment || payment.status !== "confirmed")
    return new Response("Not found or not confirmed", { status: 404 });

  // Channel decision
  const viaWhatsApp =
    payment.channel === "whatsapp" ||
    payment.profiles?.whatsapp_opt_in === true;

  if (payment.type === "ticket") {
    const { data: ticket } = await supabase
      .from("tickets").select("*").eq("payment_id", paymentId).single();
    if (!ticket) return new Response("Ticket not ready", { status: 404 });

    const alreadySent = viaWhatsApp ? ticket.whatsapp_sent : ticket.sms_sent;
    if (alreadySent) return new Response("Already delivered", { status: 200 });

    const message =
      `Ticket confirmed!\n` +
      `Event: ${payment.events.title}\n` +
      `Code: ${ticket.ticket_code}\n` +
      `View QR: ${APP_URL}/ticket/${ticket.qr_payload}\n` +
      `Show this at the entrance.`;

    if (viaWhatsApp) {
      await sendWhatsApp(payment.phone, message);
      await supabase.from("tickets").update({ whatsapp_sent: true }).eq("id", ticket.id);
    } else {
      await sendSMS(payment.phone, message);
      await supabase.from("tickets").update({ sms_sent: true }).eq("id", ticket.id);
    }
  }

  if (payment.type === "vote") {
    const { data: vote } = await supabase
      .from("votes").select("*, contestants(name, total_votes)")
      .eq("payment_id", paymentId).single();
    if (!vote) return new Response("Vote not ready", { status: 404 });

    const alreadySent = viaWhatsApp ? vote.whatsapp_sent : vote.sms_sent;
    if (alreadySent) return new Response("Already delivered", { status: 200 });

    const message =
      `Vote confirmed!\n` +
      `${vote.vote_count} vote(s) for ${vote.contestants.name}.\n` +
      `Total votes: ${vote.contestants.total_votes}.\n` +
      `Keep voting: ${APP_URL}/vote/${payment.event_id}`;

    if (viaWhatsApp) {
      await sendWhatsApp(payment.phone, message);
      await supabase.from("votes")
        .update({ whatsapp_sent: true, sms_confirmation_text: message })
        .eq("id", vote.id);
    } else {
      await sendSMS(payment.phone, message);
      await supabase.from("votes")
        .update({ sms_sent: true, sms_confirmation_text: message })
        .eq("id", vote.id);
    }
  }

  return new Response("OK", { status: 200 });
});

async function sendSMS(phone: string, message: string) {
  const normalised = phone.startsWith("0") ? "+233" + phone.slice(1) : phone;
  const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: { "api-key": ARKESEL_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ sender: ARKESEL_SENDER, message, recipients: [normalised] })
  });
  if (!res.ok) console.error("SMS failed:", await res.text());
}

async function sendWhatsApp(phone: string, message: string) {
  const normalised = phone.startsWith("0") ? "233" + phone.slice(1) : phone.replace("+","");
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalised,
        type: "text",
        text: { body: message }
      })
    }
  );
  if (!res.ok) console.error("WhatsApp failed:", await res.text());
}
```

## 3E — Frontend: buy ticket component

```tsx
// components/BuyTicketForm.tsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePaymentStatus } from "../hooks/usePaymentStatus";

export function BuyTicketForm({ eventId }: { eventId: string }) {
  const [phone, setPhone]     = useState("");
  const [network, setNetwork] = useState<"mtn"|"airteltigo"|"vodafone">("mtn");
  const [paymentId, setPaymentId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const status = usePaymentStatus(paymentId);

  async function handlePay() {
    setLoading(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please log in first"); setLoading(false); return; }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: "ticket", eventId,
          phone: phone.startsWith("0") ? "+233" + phone.slice(1) : phone,
          network, channel: "web"
        })
      }
    );

    if (!res.ok) { setError(await res.text()); setLoading(false); return; }
    const data = await res.json();
    setPaymentId(data.paymentId);
    setLoading(false);
  }

  if (status === "confirmed") return <p>Confirmed! Check your phone for your ticket.</p>;
  if (status === "failed")    return <p>Payment failed. Please try again.</p>;
  if (paymentId)              return <p>Waiting for MoMo approval on {phone}...</p>;

  return (
    <div>
      <input placeholder="MoMo number (e.g. 0244123456)" value={phone}
        onChange={e => setPhone(e.target.value)} />
      <select value={network} onChange={e => setNetwork(e.target.value as any)}>
        <option value="mtn">MTN MoMo</option>
        <option value="vodafone">Vodafone Cash</option>
        <option value="airteltigo">AirtelTigo Money</option>
      </select>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handlePay} disabled={loading}>
        {loading ? "Processing..." : "Buy Ticket"}
      </button>
    </div>
  );
}
```

## 3F — Hook: real-time payment status

```typescript
// hooks/usePaymentStatus.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Status = "pending" | "confirmed" | "failed";

export function usePaymentStatus(paymentId: string | null) {
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (!paymentId) return;
    const channel = supabase
      .channel(`payment-${paymentId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "payments",
        filter: `id=eq.${paymentId}`
      }, payload => setStatus(payload.new.status as Status))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [paymentId]);

  return status;
}
```

## 3G — How to test Flow 3

```
1. Deploy initiate-payment, paystack-webhook, send-delivery
2. Register Paystack webhook in dashboard:
   Settings → API Keys & Webhooks → Webhook URL
   https://your-project.supabase.co/functions/v1/paystack-webhook
3. Use Paystack test keys (sk_test_...) and test MoMo number
4. Click Buy Ticket — check payments table: status = "pending"
5. Approve the MoMo prompt (or simulate via Paystack test dashboard)
6. Check payments table — status = "confirmed"
7. Check tickets table — row auto-created by DB trigger
8. Check phone — SMS received (or WhatsApp if opt-in is true)
9. Check tickets.sms_sent = true OR tickets.whatsapp_sent = true
✓ Flow 3 complete — move to Flow 4
```

---
---

# FLOW 4 — User votes via the web app

**What happens:** User selects contestant → selects vote quantity → pays via
MoMo → vote recorded → leaderboard updates live → confirmation sent.

**Reuses:** `initiate-payment`, `paystack-webhook`, `send-delivery` from Flow 3.
No new Edge Functions needed.

---

## 4A — Database

```sql
create table public.votes (
  id                    uuid primary key default gen_random_uuid(),
  payment_id            uuid references public.payments(id) not null,
  user_id               uuid references public.profiles(id) not null,
  event_id              uuid references public.events(id) not null,
  contestant_id         uuid references public.contestants(id) not null,
  vote_count            integer not null default 1,
  amount_paid           numeric(10,2) not null,
  phone                 text not null,
  channel               text default 'web' check (channel in ('web','whatsapp','ussd')),
  confirmed             boolean default false,
  sms_sent              boolean default false,
  whatsapp_sent         boolean default false,
  sms_confirmation_text text,
  created_at            timestamptz default now(),
  confirmed_at          timestamptz
);

create index votes_event_id_idx      on public.votes(event_id);
create index votes_contestant_id_idx on public.votes(contestant_id);
create index votes_phone_idx         on public.votes(phone, created_at);
create index votes_user_id_idx       on public.votes(user_id);

alter table public.votes enable row level security;
create policy "users view own votes" on public.votes
  for select using (auth.uid() = user_id);
create policy "anyone views confirmed vote counts" on public.votes
  for select using (confirmed = true);
-- NO insert or update policy — service_role only
```

## 4B — Frontend: vote form component

```tsx
// components/VoteForm.tsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePaymentStatus } from "../hooks/usePaymentStatus";

const PACKAGES = [
  { qty: 1,  label: "1 vote" },
  { qty: 5,  label: "5 votes" },
  { qty: 10, label: "10 votes" },
];

export function VoteForm({ eventId, contestantId, contestantName, votePrice }: {
  eventId: string; contestantId: string;
  contestantName: string; votePrice: number;
}) {
  const [qty, setQty]         = useState(1);
  const [phone, setPhone]     = useState("");
  const [network, setNetwork] = useState<"mtn"|"airteltigo"|"vodafone">("mtn");
  const [paymentId, setPaymentId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const status = usePaymentStatus(paymentId);

  async function handleVote() {
    setLoading(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please log in first"); setLoading(false); return; }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: "vote", eventId, contestantId,
          voteQuantity: qty,
          phone: phone.startsWith("0") ? "+233" + phone.slice(1) : phone,
          network, channel: "web"
        })
      }
    );

    if (!res.ok) { setError(await res.text()); setLoading(false); return; }
    const data = await res.json();
    setPaymentId(data.paymentId);
    setLoading(false);
  }

  if (status === "confirmed") return <p>{qty} vote(s) confirmed for {contestantName}!</p>;
  if (status === "failed")    return <p>Payment failed. Try again.</p>;
  if (paymentId)              return <p>Approve MoMo payment on {phone}...</p>;

  return (
    <div>
      <p>Voting for: <strong>{contestantName}</strong></p>
      <div>
        {PACKAGES.map(p => (
          <button key={p.qty} onClick={() => setQty(p.qty)}
            style={{ fontWeight: qty === p.qty ? "bold" : "normal" }}>
            {p.label} — GHS {(votePrice * p.qty).toFixed(2)}
          </button>
        ))}
      </div>
      <input placeholder="MoMo number (e.g. 0244123456)" value={phone}
        onChange={e => setPhone(e.target.value)} />
      <select value={network} onChange={e => setNetwork(e.target.value as any)}>
        <option value="mtn">MTN MoMo</option>
        <option value="vodafone">Vodafone Cash</option>
        <option value="airteltigo">AirtelTigo Money</option>
      </select>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleVote} disabled={loading}>
        {loading ? "Processing..." : `Vote — GHS ${(votePrice * qty).toFixed(2)}`}
      </button>
    </div>
  );
}
```

## 4C — Frontend: live leaderboard hook

```typescript
// hooks/useLeaderboard.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLeaderboard(eventId: string) {
  const [contestants, setContestants] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("contestants")
      .select("id, name, photo_url, total_votes")
      .eq("event_id", eventId)
      .order("total_votes", { ascending: false })
      .then(({ data }) => setContestants(data ?? []));

    const channel = supabase
      .channel(`leaderboard-${eventId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "contestants",
        filter: `event_id=eq.${eventId}`
      }, payload => {
        setContestants(prev =>
          prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
              .sort((a, b) => b.total_votes - a.total_votes)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  return contestants;
}
```

## 4D — How to test Flow 4

```
1. Add at least 2 contestants to an active event in the DB
2. Vote for one contestant via VoteForm
3. Approve the MoMo prompt
4. Check votes table — confirmed = true, vote_count correct
5. Check contestants table — total_votes incremented
6. Check the leaderboard updates live without page refresh
7. Check phone — SMS or WhatsApp confirmation received
8. Try voting after voting_ends_at has passed — should return 400
✓ Flow 4 complete — move to Flow 5
```

---
---

# FLOW 5 — User votes via WhatsApp

**What happens:** User messages the bot → bot sends a single link to the
web app → user clicks and pays on the web → confirmation comes back via
WhatsApp.

**Design rule:** Bot is a thin redirector only. All payment logic stays on
the web app. One exchange = one conversation = minimal cost.

---

## 5A — Database

```sql
create table public.whatsapp_sessions (
  id                  uuid primary key default gen_random_uuid(),
  phone               text not null,
  profile_id          uuid references public.profiles(id),
  conversations_today integer default 0,
  last_message_at     timestamptz default now(),
  created_at          timestamptz default now()
);

create unique index on public.whatsapp_sessions(phone);
```

## 5B — Edge Function: `whatsapp-webhook`

```typescript
// supabase/functions/whatsapp-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN      = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const WHATSAPP_TOKEN    = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const APP_URL           = Deno.env.get("APP_URL")!;

// Only these words get a reply — everything else is silently ignored
const TRIGGERS     = ["vote","ticket","buy","event","book","start","hi","hello","menu"];
const LIST_TRIGGERS = ["vote","ticket","buy","event","book","menu","start"];

serve(async (req) => {
  // Meta webhook verification — one-time during setup
  if (req.method === "GET") {
    const url       = new URL(req.url);
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN)
      return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  const body     = await req.json();
  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

  // Always respond 200 to Meta immediately
  if (!messages?.length) return new Response("OK", { status: 200 });

  const msg     = messages[0];
  const from    = msg.from;
  const msgText = (msg.text?.body ?? "").toLowerCase().trim();

  // Keyword filter — silent ignore saves your conversation quota
  if (!TRIGGERS.some(k => msgText.includes(k)))
    return new Response("OK", { status: 200 });

  EdgeRuntime.waitUntil(handleMessage(from, msgText));
  return new Response("OK", { status: 200 });
});

async function handleMessage(from: string, msgText: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const phoneE164 = "+" + from;

  // Mark user as opted-in so send-delivery routes confirmations to WhatsApp
  await supabase.from("profiles")
    .update({ whatsapp_opt_in: true })
    .eq("phone", phoneE164);

  // Track session for quota awareness
  await supabase.from("whatsapp_sessions")
    .upsert({ phone: phoneE164, last_message_at: new Date().toISOString() },
             { onConflict: "phone" });

  if (LIST_TRIGGERS.some(k => msgText.includes(k))) {
    const { data: events } = await supabase
      .from("events")
      .select("id, title, vote_price, ticket_price, voting_enabled")
      .eq("status", "active")
      .order("event_date", { ascending: true })
      .limit(5);

    if (!events?.length) {
      await reply(from, "No active events right now. Check back soon!");
      return;
    }

    const lines = events.map((e: any) => {
      const parts = [`*${e.title}*`];
      if (e.voting_enabled) parts.push(`Vote: ${APP_URL}/vote/${e.id}`);
      if (e.ticket_price > 0) parts.push(`Ticket: ${APP_URL}/ticket/${e.id}`);
      return parts.join("\n");
    });

    await reply(from,
      `Active events:\n\n${lines.join("\n\n")}\n\n` +
      `Pay via MoMo or card on each link. Confirmation sent here.`
    );
  } else {
    await reply(from,
      `Welcome! Browse events, vote, and buy tickets:\n${APP_URL}\n\n` +
      `Reply *VOTE* to see active events.`
    );
  }
}

async function reply(to: string, text: string) {
  await fetch(
    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    }
  );
}
```

## 5C — Frontend: WhatsApp share button

```tsx
// components/WhatsAppShareButton.tsx
export function WhatsAppShareButton({ waNumber, eventId, type = "vote" }: {
  waNumber: string;   // Your WA Business number: 233XXXXXXXXX (no +)
  eventId: string;
  type?: "vote" | "ticket";
}) {
  const deepLink = `${process.env.NEXT_PUBLIC_APP_URL}/${type}/${eventId}`;
  const preText  = encodeURIComponent(`${type.toUpperCase()}\n${deepLink}`);
  return (
    <a href={`https://wa.me/${waNumber}?text=${preText}`}
       target="_blank" rel="noopener noreferrer">
      Share via WhatsApp
    </a>
  );
}
```

## 5D — Meta setup (one-time)

```
1. developers.facebook.com → Create App → Business type
2. Add WhatsApp product
3. Copy Access Token → WHATSAPP_TOKEN secret
4. Copy Phone Number ID → WHATSAPP_PHONE_ID secret
5. Webhooks → Configure:
   URL:            https://your-project.supabase.co/functions/v1/whatsapp-webhook
   Verify Token:   (your WHATSAPP_VERIFY_TOKEN value)
   Subscribe to:   messages
6. Free tier: 1,000 conversations/month
   NOTE: You can only reply within 24hrs of the user's last message.
   For post-event notifications, register a Message Template in
   Meta Business Manager as a fallback.
```

## 5E — How to test Flow 5

```
1. Deploy whatsapp-webhook
2. Complete Meta setup (5D)
3. Message your WhatsApp Business number: "VOTE"
4. Bot replies with active event links
5. Check Supabase:
   → whatsapp_sessions row created
   → profiles.whatsapp_opt_in = true for your number
6. Click a vote link → pay on web app → confirmation arrives on WhatsApp
7. Message "hello random text" → bot stays silent (no reply)
✓ Flow 5 complete — move to Flow 6
```

---
---

# FLOW 6 — Organiser receives payout after event ends

**What happens:** Admin sets event to `ended` → calls `release-payouts` →
Paystack transfers net revenue to organiser's MoMo.

---

## 6A — Database

```sql
create table public.payouts (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid references public.events(id) not null,
  recipient_id          uuid references public.profiles(id) not null,
  amount                numeric(10,2) not null,
  fee                   numeric(10,2) default 0,
  net_amount            numeric(10,2),
  payout_type           text check (payout_type in ('organiser','contestant','refund')),
  status                text default 'held'
                        check (status in ('held','processing','completed','failed')),
  momo_number           text,
  momo_network          text,
  paystack_transfer_ref text,
  initiated_at          timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz default now()
);

alter table public.payouts enable row level security;
create policy "recipients view own payouts" on public.payouts
  for select using (auth.uid() = recipient_id);
-- NO insert or update policy — admin Edge Function only
```

## 6B — Edge Function: `release-payouts`

```typescript
// supabase/functions/release-payouts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  // Admin only
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`)
    return new Response("Forbidden", { status: 403 });

  const { eventId } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Verify event has ended
  const { data: event } = await supabase
    .from("events")
    .select("*, profiles(momo_number, momo_network, full_name)")
    .eq("id", eventId).single();

  if (!event || event.status !== "ended")
    return new Response("Event not ended yet", { status: 400 });

  // 2. Sum confirmed revenue
  const { data: payments } = await supabase
    .from("payments").select("amount")
    .eq("event_id", eventId).eq("status", "confirmed");

  const totalRevenue = payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
  const fee          = +(totalRevenue * 0.0195).toFixed(2);
  const netAmount    = +(totalRevenue - fee).toFixed(2);

  // 3. Create payout record
  const { data: payout } = await supabase.from("payouts").insert({
    event_id: eventId,
    recipient_id: event.organiser_id,
    amount: totalRevenue, fee, net_amount: netAmount,
    payout_type: "organiser", status: "processing",
    momo_number: event.profiles.momo_number,
    momo_network: event.profiles.momo_network,
    initiated_at: new Date().toISOString()
  }).select().single();

  // 4. Create Paystack transfer recipient
  const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: { "Authorization": `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "mobile_money",
      name: event.profiles.full_name,
      account_number: event.profiles.momo_number,
      bank_code: event.profiles.momo_network === "mtn" ? "MTN"
               : event.profiles.momo_network === "vodafone" ? "VOD" : "ATL",
      currency: "GHS"
    })
  });
  const recipientData = await recipientRes.json();

  // 5. Initiate transfer
  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: { "Authorization": `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(netAmount * 100),
      recipient: recipientData.data?.recipient_code,
      reason: `Payout: ${event.title}`,
      reference: `PAYOUT-${payout.id}`
    })
  });
  const transferData = await transferRes.json();

  // 6. Update payout record
  await supabase.from("payouts").update({
    status: transferRes.ok ? "completed" : "failed",
    paystack_transfer_ref: transferData.data?.transfer_code,
    completed_at: new Date().toISOString()
  }).eq("id", payout.id);

  return new Response(
    JSON.stringify({ success: transferRes.ok, netAmount, payout }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

## 6C — How to test Flow 6

```
1. Create a test event with at least one confirmed payment
2. Set event.status = "ended" in Supabase table editor
3. Call release-payouts from terminal:
   curl -X POST \
     https://your-project.supabase.co/functions/v1/release-payouts \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"eventId":"your-event-uuid"}'
4. Check payouts table — status = "completed"
5. Check organiser's MoMo — transfer received
6. Try calling on a non-ended event — should return 400
✓ Flow 6 complete — all flows done
```

---
---

# Deployment — run after all flows are implemented and tested

```bash
# 1. Link project
supabase link --project-ref your-project-ref

# 2. Verify all secrets are set
supabase secrets list

# 3. Run all DB migrations in flow order
supabase db push

# 4. Deploy all Edge Functions
supabase functions deploy initiate-payment
supabase functions deploy paystack-webhook
supabase functions deploy send-delivery
supabase functions deploy whatsapp-webhook
supabase functions deploy release-payouts

# 5. Register Paystack webhook
#    Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL:
#    https://your-project.supabase.co/functions/v1/paystack-webhook

# 6. Register WhatsApp webhook
#    Meta App → WhatsApp → Configuration → Webhook URL:
#    https://your-project.supabase.co/functions/v1/whatsapp-webhook
#    Subscribe to: messages
```

---

# Security Checklist — verify every item before going live

| # | Rule | Where it lives |
|---|---|---|
| 1 | All secrets in Supabase Vault only | All functions use `Deno.env.get()` |
| 2 | Paystack HMAC SHA-512 verified on every call | `paystack-webhook` step 1 |
| 3 | Amount verified — no partial payment accepted | `paystack-webhook` step 5 |
| 4 | Idempotency key before Paystack call | `initiate-payment` step 5 |
| 5 | Pending DB record before Paystack call | `initiate-payment` step 6 |
| 6 | `status=confirmed` set ONLY by webhook | `paystack-webhook` step 6 |
| 7 | RLS on every table — no direct client writes | All xA migration sections |
| 8 | Frontend uses anon key only | All frontend components |
| 9 | WhatsApp keyword filter — silent ignore | `whatsapp-webhook` line 33 |
| 10 | Payout only after `event.status = ended` | `release-payouts` step 1 |
| 11 | Raw webhook stored for full audit trail | `raw_webhook jsonb` on payments |
| 12 | Confirmation channel routed per user preference | `send-delivery` channel decision |

---

# Cost at launch

| Service | Model | Fixed monthly cost |
|---|---|---|
| Supabase | Free tier (500MB DB · 500K Edge calls) | GHS 0 |
| Paystack | 1.95% per transaction | GHS 0 |
| Arkesel SMS | ~GHS 0.08 per SMS | GHS 0 |
| WhatsApp | Free up to 1,000 conversations/mo | GHS 0 |
| USSD | Deferred — add when revenue justifies ~$50/mo | GHS 0 |
| **Total** | | **GHS 0** |

---

# Migration path (when you move off Supabase)

**Zero code changes needed:** Paystack · Arkesel · WhatsApp · all Edge Function logic

**Swap only these Supabase-specific parts:**
- `createClient` → Prisma, Drizzle, or any DB client
- `pg_notify` trigger → Redis pub/sub or BullMQ
- Supabase Realtime → WebSocket server or SSE
- Supabase Auth → NextAuth, Lucia, or custom JWT middleware
- Supabase Vault → AWS Secrets Manager or Doppler

---

*Agent instruction: implement one complete flow at a time in order.
Run the "How to test" check at the end of each flow before moving to the next.
Do not start a new flow until the previous one passes all its tests.
Do not skip the Security Checklist before marking the project complete.*