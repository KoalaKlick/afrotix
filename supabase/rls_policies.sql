-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor after Prisma migrations
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is a member of an organization
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or owner of an organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is owner of an organization
CREATE OR REPLACE FUNCTION is_org_owner(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in an organization
CREATE OR REPLACE FUNCTION get_org_role(org_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role
  FROM organization_members
  WHERE organization_id = org_id
  AND user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the event creator or org admin
CREATE OR REPLACE FUNCTION can_manage_event(event_id uuid)
RETURNS boolean AS $$
DECLARE
  evt record;
BEGIN
  SELECT organization_id, creator_id INTO evt FROM events WHERE id = event_id;
  RETURN evt.creator_id = auth.uid() OR is_org_admin(evt.organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view any profile (public data)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Anyone can view organizations (public)
CREATE POLICY "organizations_select_all" ON organizations
  FOR SELECT USING (true);

-- Authenticated users can create organizations
CREATE POLICY "organizations_insert_auth" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only org admins can update their organization
CREATE POLICY "organizations_update_admin" ON organizations
  FOR UPDATE USING (is_org_admin(id));

-- Only org owners can delete their organization
CREATE POLICY "organizations_delete_owner" ON organizations
  FOR DELETE USING (is_org_owner(id));

-- =====================================================
-- ORGANIZATION MEMBERS POLICIES
-- =====================================================

-- Members can view other members in their organizations
CREATE POLICY "org_members_select_members" ON organization_members
  FOR SELECT USING (is_org_member(organization_id));

-- Org admins can add members
CREATE POLICY "org_members_insert_admin" ON organization_members
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

-- Org admins can update member roles (except can't demote owner)
CREATE POLICY "org_members_update_admin" ON organization_members
  FOR UPDATE USING (
    is_org_admin(organization_id)
    AND NOT (role = 'owner' AND user_id != auth.uid())
  );

-- Members can remove themselves, admins can remove others (except owner)
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR (is_org_admin(organization_id) AND role != 'owner')
  );

-- =====================================================
-- ORGANIZATION INVITATIONS POLICIES
-- =====================================================

-- Org members can view invitations
CREATE POLICY "org_invitations_select_members" ON organization_invitations
  FOR SELECT USING (is_org_member(organization_id) OR email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Org admins can create invitations
CREATE POLICY "org_invitations_insert_admin" ON organization_invitations
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

-- Org admins can update invitations
CREATE POLICY "org_invitations_update_admin" ON organization_invitations
  FOR UPDATE USING (is_org_admin(organization_id));

-- Org admins can delete invitations
CREATE POLICY "org_invitations_delete_admin" ON organization_invitations
  FOR DELETE USING (is_org_admin(organization_id));

-- =====================================================
-- EVENTS POLICIES
-- =====================================================

-- Public events visible to all, private events to org members only
CREATE POLICY "events_select" ON events
  FOR SELECT USING (is_public = true OR is_org_member(organization_id));

-- Org members can create events
CREATE POLICY "events_insert_members" ON events
  FOR INSERT WITH CHECK (is_org_member(organization_id));

-- Event creator or org admin can update
CREATE POLICY "events_update" ON events
  FOR UPDATE USING (creator_id = auth.uid() OR is_org_admin(organization_id));

-- Org admins can delete events
CREATE POLICY "events_delete_admin" ON events
  FOR DELETE USING (is_org_admin(organization_id));

-- =====================================================
-- VOTING CATEGORIES POLICIES
-- =====================================================

-- Visible based on event visibility
CREATE POLICY "voting_categories_select" ON voting_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = voting_categories.event_id
      AND (events.is_public = true OR is_org_member(events.organization_id))
    )
  );

-- Event managers can insert
CREATE POLICY "voting_categories_insert" ON voting_categories
  FOR INSERT WITH CHECK (can_manage_event(event_id));

-- Event managers can update
CREATE POLICY "voting_categories_update" ON voting_categories
  FOR UPDATE USING (can_manage_event(event_id));

-- Event managers can delete
CREATE POLICY "voting_categories_delete" ON voting_categories
  FOR DELETE USING (can_manage_event(event_id));

-- =====================================================
-- VOTING OPTIONS POLICIES
-- =====================================================

-- Visible based on event visibility
CREATE POLICY "voting_options_select" ON voting_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = voting_options.event_id
      AND (events.is_public = true OR is_org_member(events.organization_id))
    )
  );

-- Event managers can insert
CREATE POLICY "voting_options_insert" ON voting_options
  FOR INSERT WITH CHECK (can_manage_event(event_id));

-- Event managers can update
CREATE POLICY "voting_options_update" ON voting_options
  FOR UPDATE USING (can_manage_event(event_id));

-- Event managers can delete
CREATE POLICY "voting_options_delete" ON voting_options
  FOR DELETE USING (can_manage_event(event_id));

-- =====================================================
-- VOTES POLICIES
-- =====================================================

-- Voters can see their own votes, org admins can see all votes for their events
CREATE POLICY "votes_select" ON votes
  FOR SELECT USING (
    voter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = votes.event_id
      AND is_org_admin(events.organization_id)
    )
  );

-- Anyone can vote on public events
CREATE POLICY "votes_insert" ON votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = votes.event_id
      AND events.status = 'published'
      AND (events.is_public = true OR is_org_member(events.organization_id))
    )
  );

-- =====================================================
-- TICKET TYPES POLICIES
-- =====================================================

-- Visible based on event visibility
CREATE POLICY "ticket_types_select" ON ticket_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND (events.is_public = true OR is_org_member(events.organization_id))
    )
  );

-- Event managers can manage
CREATE POLICY "ticket_types_insert" ON ticket_types
  FOR INSERT WITH CHECK (can_manage_event(event_id));

CREATE POLICY "ticket_types_update" ON ticket_types
  FOR UPDATE USING (can_manage_event(event_id));

CREATE POLICY "ticket_types_delete" ON ticket_types
  FOR DELETE USING (can_manage_event(event_id));

-- =====================================================
-- TICKET ORDERS POLICIES
-- =====================================================

-- Buyers can see their orders, org admins can see all orders for their events
CREATE POLICY "ticket_orders_select" ON ticket_orders
  FOR SELECT USING (
    buyer_id = auth.uid()
    OR buyer_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_orders.event_id
      AND is_org_member(events.organization_id)
    )
  );

-- Anyone can create orders for public events
CREATE POLICY "ticket_orders_insert" ON ticket_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_orders.event_id
      AND events.status = 'published'
    )
  );

-- Buyers can update their pending orders
CREATE POLICY "ticket_orders_update" ON ticket_orders
  FOR UPDATE USING (
    (buyer_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_orders.event_id
      AND is_org_admin(events.organization_id)
    )
  );

-- =====================================================
-- TICKETS POLICIES
-- =====================================================

-- Ticket holders and org members can view tickets
CREATE POLICY "tickets_select" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ticket_orders
      WHERE ticket_orders.id = tickets.order_id
      AND (ticket_orders.buyer_id = auth.uid() OR ticket_orders.buyer_email = (SELECT email FROM profiles WHERE id = auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND is_org_member(events.organization_id)
    )
  );

-- System creates tickets (via order processing)
CREATE POLICY "tickets_insert" ON tickets
  FOR INSERT WITH CHECK (can_manage_event(event_id));

-- Org members can update tickets (check-in)
CREATE POLICY "tickets_update" ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND is_org_member(events.organization_id)
    )
  );

-- =====================================================
-- PROMOTERS POLICIES
-- =====================================================

-- Promoters can view their own data, admins can view all
CREATE POLICY "promoters_select" ON promoters
  FOR SELECT USING (user_id = auth.uid());

-- Users can register as promoters
CREATE POLICY "promoters_insert" ON promoters
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Promoters can update their own profile
CREATE POLICY "promoters_update" ON promoters
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- REFERRALS POLICIES
-- =====================================================

-- Promoters can view their own referrals
CREATE POLICY "referrals_select" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM promoters
      WHERE promoters.id = referrals.promoter_id
      AND promoters.user_id = auth.uid()
    )
  );

-- System creates referrals
CREATE POLICY "referrals_insert" ON referrals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM promoters
      WHERE promoters.id = referrals.promoter_id
      AND promoters.user_id = auth.uid()
    )
  );

-- =====================================================
-- COMMISSIONS POLICIES
-- =====================================================

-- Promoters can view their own commissions
CREATE POLICY "commissions_select" ON commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM promoters
      WHERE promoters.id = commissions.promoter_id
      AND promoters.user_id = auth.uid()
    )
  );

-- =====================================================
-- PROMOTER TIERS POLICIES
-- =====================================================

-- Anyone can view tiers (public info)
CREATE POLICY "promoter_tiers_select" ON promoter_tiers
  FOR SELECT USING (true);

-- =====================================================
-- WALLETS POLICIES
-- =====================================================

-- Users can view their own wallets, org admins can view org wallets
CREATE POLICY "wallets_select" ON wallets
  FOR SELECT USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND is_org_admin(organization_id))
  );

-- Users can create their own wallet
CREATE POLICY "wallets_insert" ON wallets
  FOR INSERT WITH CHECK (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_admin(organization_id)));

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Users can view transactions for their wallets
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND (wallets.user_id = auth.uid() OR (wallets.organization_id IS NOT NULL AND is_org_admin(wallets.organization_id)))
    )
  );

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Users can view their own payments
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (user_id = auth.uid() OR email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Anyone can create a payment (for checkout)
CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PAYOUTS POLICIES
-- =====================================================

-- Users can view payouts for their wallets
CREATE POLICY "payouts_select" ON payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = payouts.wallet_id
      AND (wallets.user_id = auth.uid() OR (wallets.organization_id IS NOT NULL AND is_org_admin(wallets.organization_id)))
    )
  );

-- Wallet owners can request payouts
CREATE POLICY "payouts_insert" ON payouts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = payouts.wallet_id
      AND (wallets.user_id = auth.uid() OR (wallets.organization_id IS NOT NULL AND is_org_admin(wallets.organization_id)))
    )
  );

-- =====================================================
-- FEE CONFIGURATIONS POLICIES
-- =====================================================

-- Anyone can view fee configurations (transparency)
CREATE POLICY "fee_configurations_select" ON fee_configurations
  FOR SELECT USING (is_active = true);

-- =====================================================
-- GRANT USAGE TO AUTHENTICATED USERS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on all tables to authenticated and anon (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant INSERT, UPDATE, DELETE to authenticated users (RLS will filter)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- =====================================================
-- DONE! RLS policies are now active.
-- =====================================================
