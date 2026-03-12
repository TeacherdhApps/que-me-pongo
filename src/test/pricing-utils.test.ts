import { describe, it, expect } from 'vitest';
import { calculateItemLimit, getPlanDetails, getItemPackDetails, PRICING_PLANS, ITEM_PACKS } from '../lib/pricing';
import type { SubscriptionDetails, ItemPackPurchase } from '../types';

describe('Pricing Configuration', () => {
    describe('PRICING_PLANS', () => {
        it('should have correct Free plan configuration', () => {
            expect(PRICING_PLANS.FREE).toEqual({
                id: 'free',
                name: 'Plan Gratuito',
                baseItemLimit: 100,
                price: 0,
                currency: 'MXN',
                billingPeriod: 'one-time',
                features: expect.any(Array)
            });
        });

        it('should have correct Pro plan configuration', () => {
            expect(PRICING_PLANS.PRO).toEqual({
                id: 'pro',
                name: 'Plan Pro',
                baseItemLimit: 500,
                price: 29.99,
                currency: 'MXN',
                billingPeriod: 'monthly',
                lemonSqueezyVariantId: expect.any(String),
                features: expect.any(Array)
            });
        });

        it('should have correct Unlimited plan configuration', () => {
            expect(PRICING_PLANS.UNLIMITED).toEqual({
                id: 'unlimited',
                name: 'Plan Ilimitado',
                baseItemLimit: 999999,
                price: 49.99,
                currency: 'MXN',
                billingPeriod: 'monthly',
                lemonSqueezyVariantId: expect.any(String),
                features: expect.any(Array)
            });
        });
    });

    describe('ITEM_PACKS', () => {
        it('should have correct Pack Extra configuration', () => {
            expect(ITEM_PACKS.SMALL).toEqual({
                id: 'pack-100',
                name: 'Pack Extra',
                items: 100,
                price: 14.99,
                currency: 'MXN',
                billingPeriod: 'one-time',
                lemonSqueezyVariantId: expect.any(String),
                description: '+100 prendas adicionales'
            });
        });

        it('should have correct Pack Mega configuration', () => {
            expect(ITEM_PACKS.MEDIUM).toEqual({
                id: 'pack-500',
                name: 'Pack Mega',
                items: 500,
                price: 49.99,
                currency: 'MXN',
                billingPeriod: 'one-time',
                lemonSqueezyVariantId: expect.any(String),
                description: '+500 prendas adicionales'
            });
        });
    });

    describe('calculateItemLimit', () => {
        it('should return 100 for free plan with no packs', () => {
            const subscription: SubscriptionDetails = { planId: 'free' };
            expect(calculateItemLimit(subscription, [])).toBe(100);
        });

        it('should return 500 for Pro plan with no packs', () => {
            const subscription: SubscriptionDetails = { planId: 'pro' };
            expect(calculateItemLimit(subscription, [])).toBe(500);
        });

        it('should return unlimited for Unlimited plan', () => {
            const subscription: SubscriptionDetails = { planId: 'unlimited' };
            expect(calculateItemLimit(subscription, [])).toBe(999999);
        });

        it('should add item packs to base limit', () => {
            const subscription: SubscriptionDetails = { planId: 'free' };
            const packs: ItemPackPurchase[] = [
                {
                    packId: 'pack-100',
                    purchaseDate: '2026-03-12',
                    lemonSqueezyOrderId: 'order-123',
                    itemsAdded: 100
                }
            ];
            expect(calculateItemLimit(subscription, packs)).toBe(200);
        });

        it('should handle multiple item packs', () => {
            const subscription: SubscriptionDetails = { planId: 'pro' };
            const packs: ItemPackPurchase[] = [
                {
                    packId: 'pack-100',
                    purchaseDate: '2026-03-12',
                    lemonSqueezyOrderId: 'order-123',
                    itemsAdded: 100
                },
                {
                    packId: 'pack-500',
                    purchaseDate: '2026-03-13',
                    lemonSqueezyOrderId: 'order-456',
                    itemsAdded: 500
                }
            ];
            expect(calculateItemLimit(subscription, packs)).toBe(1100); // 500 + 100 + 500
        });

        it('should default to free plan if subscription is undefined', () => {
            expect(calculateItemLimit(undefined, [])).toBe(100);
        });

        it('should default to free plan if subscription is invalid', () => {
            const subscription = { planId: 'invalid' as any };
            expect(calculateItemLimit(subscription, [])).toBe(100);
        });
    });

    describe('getPlanDetails', () => {
        it('should return Free plan details', () => {
            const plan = getPlanDetails('free');
            expect(plan.id).toBe('free');
            expect(plan.name).toBe('Plan Gratuito');
        });

        it('should return Pro plan details', () => {
            const plan = getPlanDetails('pro');
            expect(plan.id).toBe('pro');
            expect(plan.name).toBe('Plan Pro');
            expect(plan.baseItemLimit).toBe(500);
        });

        it('should return Unlimited plan details', () => {
            const plan = getPlanDetails('unlimited');
            expect(plan.id).toBe('unlimited');
            expect(plan.name).toBe('Plan Ilimitado');
        });

        it('should return Free plan as default for invalid planId', () => {
            const plan = getPlanDetails('invalid' as any);
            expect(plan.id).toBe('free');
        });
    });

    describe('getItemPackDetails', () => {
        it('should return Pack Extra details', () => {
            const pack = getItemPackDetails('pack-100');
            expect(pack?.id).toBe('pack-100');
            expect(pack?.items).toBe(100);
        });

        it('should return Pack Mega details', () => {
            const pack = getItemPackDetails('pack-500');
            expect(pack?.id).toBe('pack-500');
            expect(pack?.items).toBe(500);
        });

        it('should return undefined for invalid packId', () => {
            const pack = getItemPackDetails('invalid-pack');
            expect(pack).toBeUndefined();
        });
    });
});
