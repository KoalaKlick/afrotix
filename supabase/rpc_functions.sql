-- Function to increment vote count for a voting option
CREATE OR REPLACE FUNCTION increment_vote_count(opt_id uuid, qty integer)
RETURNS void AS $$
BEGIN
  UPDATE voting_options
  SET votes_count = votes_count + qty
  WHERE id = opt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
