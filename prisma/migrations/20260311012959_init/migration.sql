-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('voting', 'ticketed', 'advertisement', 'hybrid');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'ongoing', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('available', 'sold_out', 'hidden', 'expired');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'confirmed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "TicketCheckInStatus" AS ENUM ('not_checked_in', 'checked_in', 'cancelled');

-- CreateEnum
CREATE TYPE "PromoterStatus" AS ENUM ('pending', 'active', 'suspended', 'inactive');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'verified', 'converted', 'expired', 'invalid');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('signup', 'ticket_purchase', 'vote_purchase', 'subscription', 'bonus');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('NGN', 'USD', 'GHS', 'KES', 'ZAR', 'GBP', 'EUR');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('paystack', 'flutterwave', 'stripe', 'bank_transfer', 'wallet', 'cash', 'free');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('ticket_purchase', 'vote_purchase', 'subscription', 'refund', 'commission_payout', 'wallet_topup', 'wallet_withdrawal', 'transfer', 'fee', 'bonus', 'adjustment');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "creator_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "cover_image" TEXT,
    "banner_image" TEXT,
    "venue_name" TEXT,
    "venue_address" TEXT,
    "venue_city" TEXT,
    "venue_country" TEXT NOT NULL DEFAULT 'Nigeria',
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "virtual_link" TEXT,
    "max_attendees" INTEGER,
    "registration_deadline" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#6366f1',
    "secondary_color" TEXT NOT NULL DEFAULT '#1e293b',
    "favicon_url" TEXT,
    "website_url" TEXT,
    "contact_email" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "inviter_id" UUID,
    "email" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'member',
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "token" TEXT,
    "expires_at" TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "organization_id" UUID,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'NGN',
    "pending_credits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pending_debits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_credits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_debits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "lock_reason" TEXT,
    "last_transaction_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "wallet_id" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "fee_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fee_breakdown" JSONB,
    "balance_before" DECIMAL(15,2),
    "balance_after" DECIMAL(15,2),
    "description" TEXT,
    "notes" TEXT,
    "related_type" TEXT,
    "related_id" UUID,
    "provider" "PaymentProvider",
    "provider_reference" TEXT,
    "provider_response" JSONB,
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "completed_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "related_type" TEXT,
    "related_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'NGN',
    "provider" "PaymentProvider" NOT NULL,
    "provider_reference" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "provider_response" JSONB,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "wallet_id" UUID,
    "recipient_name" TEXT NOT NULL,
    "bank_code" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'NGN',
    "fee_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "provider" "PaymentProvider",
    "provider_reference" TEXT,
    "provider_response" JSONB,
    "related_type" TEXT,
    "related_id" UUID,
    "description" TEXT,
    "notes" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "processed_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "fee_type" TEXT NOT NULL,
    "transaction_category" "TransactionCategory",
    "percentage" DECIMAL(5,2),
    "fixed_amount" DECIMAL(15,2),
    "min_fee" DECIMAL(15,2),
    "max_fee" DECIMAL(15,2),
    "tiers" JSONB,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'NGN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "effective_from" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promoters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "referral_code" TEXT NOT NULL,
    "status" "PromoterStatus" NOT NULL DEFAULT 'pending',
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "total_referrals" INTEGER NOT NULL DEFAULT 0,
    "successful_referrals" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pending_earnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "phone_number" TEXT,
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "bank_account_name" TEXT,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promoters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promoter_id" UUID NOT NULL,
    "referred_user_id" UUID,
    "referred_email" TEXT,
    "referral_code_used" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "source" TEXT,
    "campaign" TEXT,
    "landing_page" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "converted_at" TIMESTAMPTZ,
    "first_purchase_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promoter_id" UUID NOT NULL,
    "referral_id" UUID,
    "type" "CommissionType" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "source_type" TEXT,
    "source_id" UUID,
    "base_amount" DECIMAL(15,2),
    "commission_rate" DECIMAL(5,2),
    "description" TEXT,
    "processed_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "payment_reference" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promoter_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tier_level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "min_referrals" INTEGER NOT NULL DEFAULT 0,
    "min_earnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "bonus_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "perks" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promoter_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "quantity_total" INTEGER,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "sales_start" TIMESTAMPTZ,
    "sales_end" TIMESTAMPTZ,
    "max_per_order" INTEGER NOT NULL DEFAULT 10,
    "min_per_order" INTEGER NOT NULL DEFAULT 1,
    "status" "TicketStatus" NOT NULL DEFAULT 'available',
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "buyer_id" UUID,
    "order_number" TEXT NOT NULL,
    "buyer_email" TEXT NOT NULL,
    "buyer_name" TEXT,
    "buyer_phone" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "paid_at" TIMESTAMPTZ,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "attendee_name" TEXT,
    "attendee_email" TEXT,
    "check_in_status" "TicketCheckInStatus" NOT NULL DEFAULT 'not_checked_in',
    "checked_in_at" TIMESTAMPTZ,
    "checked_in_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" INTEGER NOT NULL DEFAULT 0,
    "referred_by" UUID,
    "referral_code_used" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "max_votes_per_user" INTEGER NOT NULL DEFAULT 1,
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voting_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "category_id" UUID,
    "option_text" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "votes_count" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voting_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "category_id" UUID,
    "voter_id" UUID,
    "voter_email" TEXT,
    "voter_ip" INET,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_reference" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_events_organization" ON "events"("organization_id");

-- CreateIndex
CREATE INDEX "idx_events_creator" ON "events"("creator_id");

-- CreateIndex
CREATE INDEX "idx_events_status" ON "events"("status");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "events"("type");

-- CreateIndex
CREATE INDEX "idx_events_slug" ON "events"("slug");

-- CreateIndex
CREATE INDEX "idx_events_start_date" ON "events"("start_date");

-- CreateIndex
CREATE INDEX "idx_events_is_public" ON "events"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "events_organization_id_slug_key" ON "events"("organization_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_slug" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_created_by" ON "organizations"("created_by");

-- CreateIndex
CREATE INDEX "idx_org_members_organization" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_members_user" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "idx_org_members_role" ON "organization_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_org_invitations_organization" ON "organization_invitations"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_invitations_email" ON "organization_invitations"("email");

-- CreateIndex
CREATE INDEX "idx_org_invitations_token" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_org_invitations_status" ON "organization_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_organization_id_email_status_key" ON "organization_invitations"("organization_id", "email", "status");

-- CreateIndex
CREATE INDEX "idx_wallets_user" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallets_organization" ON "wallets"("organization_id");

-- CreateIndex
CREATE INDEX "idx_wallets_currency" ON "wallets"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "idx_transactions_wallet" ON "transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_transactions_reference" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "idx_transactions_type" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "idx_transactions_category" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "idx_transactions_created" ON "transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "idx_payments_user" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "idx_payments_reference" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_provider_ref" ON "payments"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_reference_key" ON "payouts"("reference");

-- CreateIndex
CREATE INDEX "idx_payouts_wallet" ON "payouts"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_payouts_reference" ON "payouts"("reference");

-- CreateIndex
CREATE INDEX "idx_payouts_status" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "promoters_user_id_key" ON "promoters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "promoters_referral_code_key" ON "promoters"("referral_code");

-- CreateIndex
CREATE INDEX "idx_promoters_user" ON "promoters"("user_id");

-- CreateIndex
CREATE INDEX "idx_promoters_code" ON "promoters"("referral_code");

-- CreateIndex
CREATE INDEX "idx_promoters_status" ON "promoters"("status");

-- CreateIndex
CREATE INDEX "idx_referrals_promoter" ON "referrals"("promoter_id");

-- CreateIndex
CREATE INDEX "idx_referrals_user" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE INDEX "idx_referrals_code" ON "referrals"("referral_code_used");

-- CreateIndex
CREATE INDEX "idx_referrals_status" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "idx_commissions_promoter" ON "commissions"("promoter_id");

-- CreateIndex
CREATE INDEX "idx_commissions_referral" ON "commissions"("referral_id");

-- CreateIndex
CREATE INDEX "idx_commissions_status" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "idx_commissions_type" ON "commissions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "promoter_tiers_tier_level_key" ON "promoter_tiers"("tier_level");

-- CreateIndex
CREATE INDEX "idx_ticket_types_event" ON "ticket_types"("event_id");

-- CreateIndex
CREATE INDEX "idx_ticket_types_status" ON "ticket_types"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_orders_order_number_key" ON "ticket_orders"("order_number");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_event" ON "ticket_orders"("event_id");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_buyer" ON "ticket_orders"("buyer_id");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_status" ON "ticket_orders"("status");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_number" ON "ticket_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_code_key" ON "tickets"("ticket_code");

-- CreateIndex
CREATE INDEX "idx_tickets_order" ON "tickets"("order_id");

-- CreateIndex
CREATE INDEX "idx_tickets_event" ON "tickets"("event_id");

-- CreateIndex
CREATE INDEX "idx_tickets_type" ON "tickets"("ticket_type_id");

-- CreateIndex
CREATE INDEX "idx_tickets_code" ON "tickets"("ticket_code");

-- CreateIndex
CREATE INDEX "idx_tickets_check_in" ON "tickets"("check_in_status");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "idx_profiles_email" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "idx_profiles_username" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "idx_profiles_referred_by" ON "profiles"("referred_by");

-- CreateIndex
CREATE INDEX "idx_voting_categories_event" ON "voting_categories"("event_id");

-- CreateIndex
CREATE INDEX "idx_voting_options_event" ON "voting_options"("event_id");

-- CreateIndex
CREATE INDEX "idx_voting_options_category" ON "voting_options"("category_id");

-- CreateIndex
CREATE INDEX "idx_votes_event" ON "votes"("event_id");

-- CreateIndex
CREATE INDEX "idx_votes_option" ON "votes"("option_id");

-- CreateIndex
CREATE INDEX "idx_votes_voter" ON "votes"("voter_id");

-- CreateIndex
CREATE INDEX "idx_votes_created_at" ON "votes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "votes_event_id_option_id_voter_id_key" ON "votes"("event_id", "option_id", "voter_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promoters" ADD CONSTRAINT "promoters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_promoter_id_fkey" FOREIGN KEY ("promoter_id") REFERENCES "promoters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_promoter_id_fkey" FOREIGN KEY ("promoter_id") REFERENCES "promoters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ticket_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "promoters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_categories" ADD CONSTRAINT "voting_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "voting_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "voting_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "voting_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
