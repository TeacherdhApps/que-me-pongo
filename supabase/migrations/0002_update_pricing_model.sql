-- Migration: Update profiles table for simplified pricing model
-- Date: 2026-03-12
-- Description: 100 free items + $14.99 MXN per 100 additional items

-- Step 1: Add item_packs column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS item_packs JSONB DEFAULT '[]'::jsonb;

-- Step 2: Remove old subscription columns if they exist (cleanup from previous model)
ALTER TABLE profiles 
DROP COLUMN IF EXISTS subscription_plan_id,
DROP COLUMN IF EXISTS subscription_start_date,
DROP COLUMN IF EXISTS subscription_end_date,
DROP COLUMN IF EXISTS subscription_lemon_squeezy_order_id,
DROP COLUMN IF EXISTS subscription_status;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN profiles.item_packs IS 'JSON array of purchased item packs: [{packId, purchaseDate, lemonSqueezyOrderId, itemsAdded}]';

-- Step 4: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_item_packs ON profiles USING GIN (item_packs);

-- Step 5: Create helper function to calculate item limit
CREATE OR REPLACE FUNCTION calculate_user_item_limit(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  pack_items INTEGER := 0;
  pack JSONB;
BEGIN
  -- Calculate additional items from packs
  FOR pack IN SELECT * FROM jsonb_array_elements(
    (SELECT COALESCE(item_packs, '[]'::jsonb) FROM profiles WHERE id = user_id)
  )
  LOOP
    pack_items := pack_items + (pack->>'itemsAdded')::INTEGER;
  END LOOP;
  
  -- Base limit is 100, plus items from packs
  RETURN 100 + pack_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to check if user can add items
CREATE OR REPLACE FUNCTION can_user_add_item(user_id UUID, current_item_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  item_limit INTEGER;
BEGIN
  item_limit := calculate_user_item_limit(user_id);
  RETURN current_item_count < item_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_user_item_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_add_item(UUID, INTEGER) TO authenticated;
