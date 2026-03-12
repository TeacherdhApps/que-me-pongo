# ¿Qué Me Pongo? - Simple Free Tier

## 📦 Current Pricing Model

**300 items FREE - No payments, no subscriptions**

That's it! Simple and straightforward.

---

## ✨ Features

- ✅ **300 items** - Completely free
- ✅ **No payment required** - Forever free
- ✅ **No subscriptions** - No credit card needed
- ✅ **No webhooks** - No backend payment processing
- ✅ **No Lemon Squeezy** - Removed all payment integration

---

## 📝 What Changed

### Removed
- ❌ Lemon Squeezy integration
- ❌ Payment webhooks
- ❌ Subscription logic
- ❌ Item pack purchases
- ❌ Pricing modal
- ❌ usePricing hook
- ❌ Complex pricing tiers

### Simplified
- ✅ Single limit: 300 items
- ✅ Simple storage indicator
- ✅ Clean SettingsView
- ✅ No payment-related database columns

---

## 🚀 Setup

### Database Migration

Run this in Supabase SQL Editor:

```sql
-- Copy from: supabase/migrations/0002_simple_free_tier.sql
```

This will:
- Remove old payment/subscription columns
- Set simple 300 item limit
- Clean up database structure

### That's It!

No Lemon Squeezy account needed.
No webhook configuration.
No variant IDs to manage.

---

## 💡 Item Limit

```
All Users: 300 items FREE
```

**Storage Indicator shows:**
- Current usage: "X de 300 prendas utilizadas"
- Progress bar visualization
- Red warning when limit reached

---

## 🎨 UI Changes

### Settings View
- Shows "Plan Gratuito" badge
- Displays current usage out of 300 items
- Green info box: "300 prendas gratis"
- No purchase buttons
- No upgrade options

### Add Item Modal
- Simple storage indicator
- Shows "Plan Gratuito"
- Progress bar to 300 items
- Warning when limit reached

---

## 📊 Database Schema

```sql
profiles table:
- id (UUID)
- email
- isPro (boolean) - kept for backward compatibility
- ... other user fields

-- No item_packs column
-- No subscription columns
-- Simple and clean
```

---

## 🧪 Tests

All tests updated for 300 item limit:
- `pricing-utils.test.ts` - Tests FREE_ITEM_LIMIT = 300
- `pricing.test.tsx` - Tests AddItemModal with 300 limit
- `wardrobe.test.tsx` - Integration tests

---

## ✅ Build Status

```
✓ TypeScript compilation successful
✓ Vite build successful
✓ 146 modules transformed
✓ No errors
```

---

## 🔄 If You Want to Change the Limit

Just update one constant:

**File: `src/lib/pricing.ts`**
```typescript
export const FREE_ITEM_LIMIT = 500; // Change to any number
```

**File: `supabase/migrations/0002_simple_free_tier.sql`**
```sql
RETURN 500; -- Update the SQL function too
```

That's it! No other changes needed.

---

## 📁 File Structure

```
src/
├── lib/
│   └── pricing.ts          # Simple: FREE_ITEM_LIMIT = 300
├── components/
│   ├── AddItemModal.tsx    # Shows 300 item limit
│   ├── SettingsView.tsx    # Free tier UI
│   └── ClosetView.tsx      # Storage indicator
├── types.ts                # Clean UserProfile (no payment types)
└── test/
    ├── pricing-utils.test.ts
    ├── pricing.test.tsx
    └── wardrobe.test.tsx

supabase/
└── migrations/
    └── 0002_simple_free_tier.sql
```

---

## 🆚 Comparison

| Before | After |
|--------|-------|
| Complex subscription tiers | Simple 300 items free |
| Lemon Squeezy integration | No payment system |
| Webhook handling | No webhooks |
| Item packs for purchase | Everything free |
| Multiple pricing files | One simple constant |
| Database: item_packs JSON | Clean schema |

---

## 🎯 Benefits

1. **Simpler codebase** - Removed ~1000 lines of payment logic
2. **No dependencies** - No Lemon Squeezy account needed
3. **Better UX** - Users don't hit paywalls
4. **Easier maintenance** - No webhook debugging
5. **Faster development** - No payment testing
6. **Lower costs** - No payment processing fees

---

## 📈 Future Considerations

If you want to monetize later, options include:
- Donations / Buy me a coffee
- Premium features (not item limits)
- Sponsored features
- Affiliate links
- Premium support

But for now: **100% free, 300 items, no payments!** 🎉

---

## 🆘 Support

**Need to adjust the limit?**
- Edit `src/lib/pricing.ts` line 6
- Update migration SQL
- Run migration

**Database issues?**
- Check migration ran successfully
- Verify `calculate_user_item_limit()` returns 300

**Build errors?**
- Run `npm run build`
- Check for TypeScript errors

---

**Enjoy your simple, free wardrobe app!** 👕👖👟
