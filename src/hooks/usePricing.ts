import { useMemo } from 'react';
import { useUserProfile } from './useUserProfile';
import { useWardrobe } from './useWardrobe';
import { calculateItemLimit, getPlanDetails, getItemPackDetails } from '../lib/pricing';
import type { PlanId, ItemPackId } from '../lib/pricing';
import type { ItemPackPurchase } from '../types';

export interface PricingState {
    /** Current item count in wardrobe */
    currentItems: number;
    /** Maximum items allowed */
    itemLimit: number;
    /** Remaining items that can be added */
    remainingItems: number;
    /** Percentage of limit used */
    usagePercentage: number;
    /** Whether user can add more items */
    canAddItems: boolean;
    /** Whether user is at or over limit */
    isAtLimit: boolean;
    /** Current plan details */
    currentPlan: ReturnType<typeof getPlanDetails>;
    /** Whether user has Pro plan */
    isPro: boolean;
    /** Whether user has Unlimited plan */
    isUnlimited: boolean;
    /** Purchased item packs */
    itemPacks: ItemPackPurchase[];
    /** Total items from packs */
    packItemsTotal: number;
}

export interface PricingActions {
    /** Upgrade to a subscription plan */
    upgradePlan: (planId: PlanId) => Promise<void>;
    /** Purchase an item pack */
    purchaseItemPack: (packId: ItemPackId) => Promise<void>;
    /** Cancel current subscription */
    cancelSubscription: () => Promise<void>;
    /** Get checkout URL for a plan */
    getPlanCheckoutUrl: (planId: PlanId) => string;
    /** Get checkout URL for an item pack */
    getItemPackCheckoutUrl: (packId: ItemPackId) => string;
}

/**
 * Hook for managing pricing, subscriptions, and item limits
 */
export function usePricing(): PricingState & PricingActions {
    const { profile, update } = useUserProfile();
    const { wardrobe } = useWardrobe();

    // Calculate item limit from subscription and item packs
    const itemLimit = useMemo(() => {
        return calculateItemLimit(profile.subscription, profile.itemPacks);
    }, [profile.subscription, profile.itemPacks]);

    const currentItems = wardrobe.length;
    const remainingItems = Math.max(0, itemLimit - currentItems);
    const usagePercentage = Math.min(100, (currentItems / itemLimit) * 100);
    const canAddItems = currentItems < itemLimit;
    const isAtLimit = currentItems >= itemLimit;

    const currentPlanId: PlanId = profile.subscription?.planId || 'free';
    const currentPlan = getPlanDetails(currentPlanId);

    const isPro = currentPlanId === 'pro';
    const isUnlimited = currentPlanId === 'unlimited';

    const itemPacks = profile.itemPacks || [];
    const packItemsTotal = itemPacks.reduce((sum, pack) => sum + pack.itemsAdded, 0);

    // Actions
    const upgradePlan = async (planId: PlanId) => {
        const checkoutUrl = getPlanCheckoutUrl(planId);
        window.open(checkoutUrl, '_blank');
        // Note: Subscription will be updated via webhook after purchase
    };

    const purchaseItemPack = async (packId: ItemPackId) => {
        const checkoutUrl = getItemPackCheckoutUrl(packId);
        window.open(checkoutUrl, '_blank');
        // Note: Item pack will be added via webhook after purchase
    };

    const cancelSubscription = async () => {
        // This would typically call Lemon Squeezy API to cancel
        // For now, we'll update local state
        await update({
            subscription: {
                ...profile.subscription,
                status: 'cancelled',
                planId: profile.subscription?.planId || 'free'
            }
        });
    };

    const getPlanCheckoutUrl = (planId: PlanId) => {
        const plan = getPlanDetails(planId);
        if (!plan.lemonSqueezyVariantId) {
            throw new Error(`No checkout URL configured for plan: ${planId}`);
        }
        
        return getLemonSqueezyCheckoutUrl(plan.lemonSqueezyVariantId);
    };

    const getItemPackCheckoutUrl = (packId: ItemPackId) => {
        const pack = getItemPackDetails(packId);
        if (!pack) {
            throw new Error(`Item pack not found: ${packId}`);
        }
        if (!pack.lemonSqueezyVariantId) {
            throw new Error(`No checkout URL configured for pack: ${packId}`);
        }
        
        return getLemonSqueezyCheckoutUrl(pack.lemonSqueezyVariantId);
    };

    // Helper to build Lemon Squeezy checkout URL with user ID
    const getLemonSqueezyCheckoutUrl = (variantId: string) => {
        // Note: In a real implementation, you'd get the current user synchronously
        // For now, we'll handle this in the component level
        return `https://quemepongo.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=PENDING`;
    };

    return {
        // State
        currentItems,
        itemLimit,
        remainingItems,
        usagePercentage,
        canAddItems,
        isAtLimit,
        currentPlan,
        isPro,
        isUnlimited,
        itemPacks,
        packItemsTotal,
        // Actions
        upgradePlan,
        purchaseItemPack,
        cancelSubscription,
        getPlanCheckoutUrl,
        getItemPackCheckoutUrl
    };
}

/**
 * Get display text for item limit
 */
export function getItemLimitText(limit: number): string {
    if (limit >= 999999) {
        return '∞';
    }
    return limit.toString();
}

/**
 * Get plan badge component props
 */
export function getPlanBadgeProps(planId: PlanId) {
    switch (planId) {
        case 'free':
            return {
                label: 'FREE',
                className: 'bg-zinc-100 text-zinc-600',
                icon: 'fa-seedling'
            };
        case 'pro':
            return {
                label: 'PRO',
                className: 'bg-amber-100 text-amber-700',
                icon: 'fa-gem'
            };
        case 'unlimited':
            return {
                label: 'UNLIMITED',
                className: 'bg-purple-100 text-purple-700',
                icon: 'fa-crown'
            };
        default:
            return {
                label: 'FREE',
                className: 'bg-zinc-100 text-zinc-600',
                icon: 'fa-seedling'
            };
    }
}
