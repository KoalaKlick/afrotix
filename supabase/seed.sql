-- Seed Data for Development
-- Run this AFTER all migrations to populate test data

-- Note: These UUIDs are placeholders. In production, profiles are auto-created
-- when users sign up via Supabase Auth.

-- ===========================================
-- SAMPLE ORGANIZATION
-- ===========================================

-- First, you'll need to have at least one user signed up.
-- Then you can create an organization like this:

/*
-- Replace 'YOUR_USER_ID' with an actual user ID from auth.users

INSERT INTO public.organizations (name, slug, description, brand_color, created_by)
VALUES (
  'AfroTix Demo',
  'afrotix-demo',
  'Demo organization for testing the AfroTix platform',
  '#FF6B35',
  'YOUR_USER_ID'
);

-- Add the creator as owner
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  o.id,
  'YOUR_USER_ID',
  'owner'
FROM public.organizations o
WHERE o.slug = 'afrotix-demo';

-- Create a sample event
INSERT INTO public.events (
  organization_id,
  creator_id,
  title,
  description,
  slug,
  type,
  status,
  start_date,
  end_date,
  is_public,
  venue_name,
  venue_city,
  venue_country
)
SELECT
  o.id,
  'YOUR_USER_ID',
  'Pan-African Music Awards 2026',
  'Celebrating the best in African music across the continent',
  'pama-2026',
  'voting',
  'published',
  '2026-06-15 18:00:00+01',
  '2026-06-15 23:00:00+01',
  TRUE,
  'Eko Convention Centre',
  'Accra',
  'Ghana'
FROM public.organizations o
WHERE o.slug = 'afrotix-demo';

-- Create voting categories
INSERT INTO public.voting_categories (event_id, name, description, order_idx)
SELECT
  e.id,
  'Best African Artist',
  'Vote for the most outstanding African artist of the year',
  1
FROM public.events e
WHERE e.slug = 'pama-2026';

INSERT INTO public.voting_categories (event_id, name, description, order_idx)
SELECT
  e.id,
  'Best New Artist',
  'Vote for the breakthrough artist of the year',
  2
FROM public.events e
WHERE e.slug = 'pama-2026';

-- Create voting options
INSERT INTO public.voting_options (event_id, category_id, option_text, description, order_idx)
SELECT
  e.id,
  c.id,
  'Burna Boy',
  'Ghanan Afrobeats and Afrofusion artist',
  1
FROM public.events e
JOIN public.voting_categories c ON c.event_id = e.id
WHERE e.slug = 'pama-2026' AND c.name = 'Best African Artist';

INSERT INTO public.voting_options (event_id, category_id, option_text, description, order_idx)
SELECT
  e.id,
  c.id,
  'Wizkid',
  'Ghanan singer and songwriter',
  2
FROM public.events e
JOIN public.voting_categories c ON c.event_id = e.id
WHERE e.slug = 'pama-2026' AND c.name = 'Best African Artist';

INSERT INTO public.voting_options (event_id, category_id, option_text, description, order_idx)
SELECT
  e.id,
  c.id,
  'Tyla',
  'South African singer and songwriter',
  3
FROM public.events e
JOIN public.voting_categories c ON c.event_id = e.id
WHERE e.slug = 'pama-2026' AND c.name = 'Best African Artist';

*/

-- ===========================================
-- HELPFUL QUERIES
-- ===========================================

-- View all organizations with member counts
/*
SELECT 
  o.*,
  COUNT(om.id) as member_count
FROM public.organizations o
LEFT JOIN public.organization_members om ON om.organization_id = o.id
GROUP BY o.id;
*/

-- View all events with vote counts
/*
SELECT 
  e.*,
  SUM(vo.votes_count) as total_votes
FROM public.events e
LEFT JOIN public.voting_options vo ON vo.event_id = e.id
GROUP BY e.id;
*/

-- View leaderboard for an event
/*
SELECT 
  vo.option_text,
  vo.votes_count,
  vc.name as category
FROM public.voting_options vo
JOIN public.voting_categories vc ON vc.id = vo.category_id
WHERE vo.event_id = 'EVENT_ID'
ORDER BY vo.votes_count DESC;
*/
