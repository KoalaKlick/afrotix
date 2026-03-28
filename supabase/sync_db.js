const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env file manually (no dotenv dependency needed)
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: No database connection string found. Set DIRECT_URL or DATABASE_URL in .env");
  process.exit(1);
}

const client = new Client({ connectionString });

async function sync() {
  try {
    await client.connect();
    console.log("Connected to database");

    const sql = `
      -- 1. Updates to profiles
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS momo_number text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS momo_network text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pricing_plan text DEFAULT 'essential';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS communication_credits decimal DEFAULT 0;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_partner boolean DEFAULT false;
      
      -- 2. Updates to payments
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paystack_transaction_id text;
      
      -- 3. Updates to tickets
      ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS sms_sent boolean DEFAULT false;
      ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false;
      
      -- 4. Updates to votes
      ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS payment_id uuid;
      ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS sms_sent boolean DEFAULT false;
      ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false;

      -- 5. Updates to promoters
      ALTER TABLE public.promoters ADD COLUMN IF NOT EXISTS is_gold_tier boolean DEFAULT false;
      ALTER TABLE public.promoters ADD COLUMN IF NOT EXISTS total_revenue_generated decimal DEFAULT 0;
      
      -- 6. RPC Functions
      CREATE OR REPLACE FUNCTION increment_vote_count(opt_id uuid, qty integer)
      RETURNS void AS $$
      BEGIN
        UPDATE public.voting_options
        SET votes_count = COALESCE(votes_count, 0) + qty
        WHERE id = opt_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION increment_promoter_revenue(p_id uuid, amt decimal)
      RETURNS void AS $$
      BEGIN
        UPDATE public.promoters
        SET total_revenue_generated = COALESCE(total_revenue_generated, 0) + amt
        WHERE id = p_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await client.query(sql);
    console.log("Database sync successful!");

  } catch (err) {
    console.error("Database sync failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

sync();
