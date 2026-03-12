-- Migration: Update profiles table for new pricing model
-- Date: 2026-03-12
-- Description: Add subscription details and item packs support

-- Step 1: Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_lemon_squeezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS item_packs JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN profiles.subscription_plan_id IS 'Plan ID: free, pro, or unlimited';
COMMENT ON COLUMN profiles.subscription_status IS 'Status: active, cancelled, expired, or trialing';
COMMENT ON COLUMN profiles.item_packs IS 'JSON array of purchased item packs: [{packId, purchaseDate, lemonSqueezyOrderId, itemsAdded}]';

-- Step 3: Create index for faster queries on subscription status
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Step 4: Migrate existing isPro data to new subscription_plan_id
-- Users with isPro = true get 'pro' plan, others remain 'free'
UPDATE profiles 
SET subscription_plan_id = CASE 
    WHEN isPro = true THEN 'pro' 
    ELSE 'free' 
END
WHERE subscription_plan_id = 'free';

-- Step 5: Update subscription_status for existing Pro users
UPDATE profiles 
SET subscription_status = 'active'
WHERE isPro = true;

-- Note: We keep isPro column for backward compatibility
-- New code should use subscription_plan_id instead

-- Step 6: Create helper function to calculate item limit
CREATE OR REPLACE FUNCTION calculate_user_item_limit(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  plan_id TEXT;
  base_limit INTEGER;
  pack_items INTEGER := 0;
  pack JSONB;
BEGIN
  -- Get subscription plan
  SELECT subscription_plan_id INTO plan_id
  FROM profiles
  WHERE id = user_id;
  
  -- Set base limit based on plan
  IF plan_id = 'free' THEN
    base_limit := 100;
  ELSIF plan_id = 'pro' THEN
    base_limit := 500;
  ELSIF plan_id = 'unlimited' THEN
    base_limit := 999999;
  ELSE
    base_limit := 100; -- Default to free plan
  END IF;
  
  -- Calculate additional items from packs
  FOR pack IN SELECT * FROM jsonb_array_elements(
    (SELECT item_packs FROM profiles WHERE id = user_id)
  )
  LOOP
    pack_items := pack_items + (pack->>'itemsAdded')::INTEGER;
  END LOOP;
  
  RETURN base_limit + pack_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to check if user can add items
CREATE OR REPLACE FUNCTION can_user_add_item(user_id UUID, current_item_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  item_limit INTEGER;
BEGIN
  item_limit := calculate_user_item_limit(user_id);
  RETURN current_item_count < item_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_user_item_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_add_item(UUID, INTEGER) TO authenticated;
