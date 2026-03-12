# Supabase Setup Guide for New Pricing Model

## Overview
This guide walks you through updating your Supabase project to support the new hybrid pricing model (Subscription + Item Packs).

---

## 📋 Prerequisites

1. Access to your Supabase project dashboard
2. Admin privileges to run SQL migrations
3. Backup of your current database (optional but recommended)

---

## 🚀 Step 1: Run the Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** → **New Query**
3. Copy the contents of `supabase/migrations/0002_update_pricing_model.sql`
4. Paste into the SQL editor
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply the migration directly
psql -h db.<your-project-ref>.supabase.co -U postgres -d postgres -f supabase/migrations/0002_update_pricing_model.sql
```

---

## 🔧 Step 2: Verify the Migration

Run this query to verify the new columns were added:

```sql
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE 'subscription%'
ORDER BY column_name;
```

You should see:
- `subscription_plan_id` (text, default 'free')
- `subscription_start_date` (timestamptz)
- `subscription_end_date` (timestamptz)
- `subscription_lemon_squeezy_order_id` (text)
- `subscription_status` (text, default 'active')
- `item_packs` (jsonb, default '[]')

---

## 🍋 Step 3: Configure Lemon Squeezy Products

You need to create the following products/variants in Lemon Squeezy:

### 1. Pro Subscription (Monthly)
- **Product Type**: Subscription
- **Name**: Plan Pro Mensual
- **Price**: $29.99 MXN/month
- **Variant ID**: Update in `src/lib/pricing.ts` as `PRO.lemonSqueezyVariantId`

### 2. Unlimited Subscription (Monthly)
- **Product Type**: Subscription
- **Name**: Plan Ilimitado Mensual
- **Price**: $49.99 MXN/month
- **Variant ID**: Update in `src/lib/pricing.ts` as `UNLIMITED.lemonSqueezyVariantId`

### 3. Pack Extra (One-time)
- **Product Type**: One-time
- **Name**: Pack Extra +100 prendas
- **Price**: $14.99 MXN
- **Variant ID**: Update in `src/lib/pricing.ts` as `ITEM_PACKS.SMALL.lemonSqueezyVariantId`

### 4. Pack Mega (One-time)
- **Product Type**: One-time
- **Name**: Pack Mega +500 prendas
- **Price**: $49.99 MXN
- **Variant ID**: Update in `src/lib/pricing.ts` as `ITEM_PACKS.MEDIUM.lemonSqueezyVariantId`

### 5. Pack Max (One-time)
- **Product Type**: One-time
- **Name**: Pack Max +1000 prendas
- **Price**: $79.99 MXN
- **Variant ID**: Update in `src/lib/pricing.ts` as `ITEM_PACKS.LARGE.lemonSqueezyVariantId`

---

## 🔗 Step 4: Update Lemon Squeezy Webhook

The webhook needs to handle both subscriptions and item packs.

### Update Webhook Handler

The webhook at `supabase/functions/lemon-squeezy-webhook/index.ts` has been updated to handle:
- `subscription_created` → Update `subscription_plan_id` and `subscription_status`
- `subscription_cancelled` → Update `subscription_status` to 'cancelled'
- `order_created` (for item packs) → Add to `item_packs` array

### Webhook Configuration in Lemon Squeezy

1. Go to Lemon Squeezy Dashboard → Settings → Webhooks
2. Add new webhook endpoint:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook
   ```
3. Select events:
   - ✅ Order Created
   - ✅ Subscription Created
   - ✅ Subscription Cancelled
   - ✅ Subscription Expired
4. Save the signing secret
5. Update `LEMON_SQUEEZY_SIGNING_SECRET` in your Supabase Edge Function secrets

---

## 🧪 Step 5: Test the Integration

### Test 1: Verify Free Plan Limit

```sql
-- Check item limit for a free user
SELECT 
  id,
  subscription_plan_id,
  calculate_user_item_limit(id) as item_limit
FROM profiles
WHERE subscription_plan_id = 'free'
LIMIT 1;
```

Expected: `item_limit = 100`

### Test 2: Verify Pro Plan Limit

```sql
-- Temporarily set a user to Pro
UPDATE profiles 
SET subscription_plan_id = 'pro'
WHERE email = 'test@example.com';

-- Check limit
SELECT 
  id,
  subscription_plan_id,
  calculate_user_item_limit(id) as item_limit
FROM profiles
WHERE email = 'test@example.com';
```

Expected: `item_limit = 500`

### Test 3: Verify Item Packs

```sql
-- Add a test item pack to a user
UPDATE profiles 
SET item_packs = item_packs || '[{"packId": "pack-100", "purchaseDate": "2026-03-12", "lemonSqueezyOrderId": "test-order-123", "itemsAdded": 100}]'::jsonb
WHERE email = 'test@example.com';

-- Check updated limit
SELECT 
  id,
  subscription_plan_id,
  item_packs,
  calculate_user_item_limit(id) as item_limit
FROM profiles
WHERE email = 'test@example.com';
```

Expected: `item_limit = 600` (500 Pro + 100 from pack)

---

## 📊 Step 6: Row Level Security (RLS) Policies

Ensure users can only read/update their own subscription data:

```sql
-- Verify RLS is enabled on profiles table
SELECT rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Create policy if it doesn't exist
CREATE POLICY "Users can view own subscription"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own subscription"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Service role can update any profile (for webhooks)
CREATE POLICY "Service role can update profiles"
ON profiles FOR UPDATE
USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
```

---

## 🔐 Step 7: Update Environment Variables

Add these to your Supabase Edge Functions secrets:

```bash
# Navigate to your functions directory
cd supabase/functions/lemon-squeezy-webhook

# Set the secrets
supabase secrets set LEMON_SQUEEZY_SIGNING_SECRET=<your-signing-secret>
supabase secrets set LEMON_SQUEEZY_API_KEY=<your-api-key>
```

Also update your frontend `.env`:

```env
# Add Lemon Squeezy product/variant IDs if you want them environment-specific
VITE_LEMON_SQUEEZY_PRO_VARIANT_ID=2131fda6-1821-42d0-a7a0-c9eac6dd29ae
VITE_LEMON_SQUEEZY_PACK_100_ID=<to-be-created>
VITE_LEMON_SQUEEZY_PACK_500_ID=<to-be-created>
```

---

## 📈 Step 8: Monitor and Analytics

### Useful Queries for Monitoring

#### Active Subscriptions by Plan
```sql
SELECT 
  subscription_plan_id,
  subscription_status,
  COUNT(*) as user_count
FROM profiles
GROUP BY subscription_plan_id, subscription_status;
```

#### Revenue from Item Packs
```sql
SELECT 
  COUNT(*) as packs_sold,
  SUM((item_packs->>'itemsAdded')::INTEGER) as total_items_sold
FROM profiles,
LATERAL jsonb_array_elements(item_packs) as item_packs;
```

#### Users Approaching Limit
```sql
SELECT 
  p.id,
  p.subscription_plan_id,
  calculate_user_item_limit(p.id) as item_limit,
  COUNT(c.id) as current_items,
  (calculate_user_item_limit(p.id) - COUNT(c.id)) as remaining
FROM profiles p
LEFT JOIN clothing_items c ON p.id = c.user_id
GROUP BY p.id, p.subscription_plan_id
HAVING COUNT(c.id) > (calculate_user_item_limit(p.id) * 0.8)
ORDER BY remaining ASC;
```

---

## 🆘 Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The columns may have been added previously. Run:
```sql
-- Check existing columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name LIKE 'subscription%';
```

### Issue: Function `calculate_user_item_limit` not found
**Solution**: Re-run the migration SQL or create manually:
```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'calculate_user_item_limit';
```

### Issue: Webhook not updating profiles
**Solution**: 
1. Check Edge Function logs in Supabase dashboard
2. Verify signing secret is correct
3. Ensure RLS policies allow service role updates
4. Test webhook with Lemon Squeezy's "Send test notification" feature

---

## 📝 Migration Checklist

- [ ] Backup database
- [ ] Run migration SQL
- [ ] Verify new columns exist
- [ ] Test helper functions
- [ ] Create Lemon Squeezy products
- [ ] Update variant IDs in code
- [ ] Configure webhook
- [ ] Test subscription flow
- [ ] Test item pack purchase
- [ ] Update RLS policies if needed
- [ ] Set environment variables
- [ ] Deploy updated code

---

## 🎯 Next Steps

After completing this setup:

1. **Update frontend code** - Already done in this PR
2. **Test end-to-end purchase flow**
3. **Update pricing UI** in SettingsView
4. **Monitor first purchases**
5. **Gather user feedback**
6. **Adjust pricing if needed**

---

## 📞 Support

If you encounter issues:
- Supabase Docs: https://supabase.com/docs
- Lemon Squeezy Docs: https://www.lemonsqueezy.com/help
- Check Edge Function logs in Supabase dashboard
- Review webhook delivery logs in Lemon Squeezy dashboard
