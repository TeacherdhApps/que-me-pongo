-- Migration: Update profiles table for free tier (200 items)
-- Date: 2026-03-12
-- Description: Simple 200 free items limit - no payments

-- Step 1: Clean up old columns if they exist
ALTER TABLE profiles 
DROP COLUMN IF EXISTS item_packs,
DROP COLUMN IF EXISTS subscription_plan_id,
DROP COLUMN IF EXISTS subscription_start_date,
DROP COLUMN IF EXISTS subscription_end_date,
DROP COLUMN IF EXISTS subscription_lemon_squeezy_order_id,
DROP COLUMN IF EXISTS subscription_status;

-- Step 2: Ensure isPro column exists (for backward compatibility)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS isPro BOOLEAN DEFAULT false;

-- Step 3: Create helper function to calculate item limit (always 200 for now)
CREATE OR REPLACE FUNCTION calculate_user_item_limit(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Simple: 200 items for all users
  RETURN 200;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to check if user can add items
CREATE OR REPLACE FUNCTION can_user_add_item(user_id UUID, current_item_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  item_limit INTEGER := 200;
BEGIN
  RETURN current_item_count < item_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_user_item_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_add_item(UUID, INTEGER) TO authenticated;
