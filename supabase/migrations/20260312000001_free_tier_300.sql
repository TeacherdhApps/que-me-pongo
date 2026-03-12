-- Migration: Update free tier to 300 items
-- Date: 2026-03-12
-- Description: Increase the maximum allowed free items from 200 to 300

-- Step 1: Update helper function to calculate item limit (now 300)
CREATE OR REPLACE FUNCTION calculate_user_item_limit(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- 300 items for all users
  RETURN 300;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update function to check if user can add items
CREATE OR REPLACE FUNCTION can_user_add_item(user_id UUID, current_item_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  item_limit INTEGER := 300;
BEGIN
  RETURN current_item_count < item_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
