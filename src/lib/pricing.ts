/**
 * Pricing Configuration for "¿Qué Me Pongo?"
 * Hybrid Model: Subscription + Item Packs
 */

import type { SubscriptionDetails, ItemPackPurchase } from '../types';

interface PricingPlan {
  id: string;
  name: string;
  baseItemLimit: number;
  price: number;
  currency: string;
  billingPeriod: 'one-time' | 'monthly';
  lemonSqueezyVariantId?: string;
  features: string[];
}

interface ItemPack {
  id: string;
  name: string;
  items: number;
  price: number;
  currency: string;
  billingPeriod: 'one-time';
  lemonSqueezyVariantId: string;
  description: string;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  FREE: {
    id: 'free',
    name: 'Plan Gratuito',
    baseItemLimit: 100,
    price: 0,
    currency: 'MXN',
    billingPeriod: 'one-time',
    features: [
      '100 prendas básicas',
      'Planificador semanal',
      'Exportar datos',
      'Sincronización en la nube'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Plan Pro',
    baseItemLimit: 500,
    price: 29.99,
    currency: 'MXN',
    billingPeriod: 'monthly',
    lemonSqueezyVariantId: '2131fda6-1821-42d0-a7a0-c9eac6dd29ae', // Existing Pro variant
    features: [
      '500 prendas',
      'Funciones premium de IA',
      'Sincronización con calendario',
      'Prioridad en sugerencias',
      'Soporte prioritario'
    ]
  },
  UNLIMITED: {
    id: 'unlimited',
    name: 'Plan Ilimitado',
    baseItemLimit: 999999,
    price: 49.99,
    currency: 'MXN',
    billingPeriod: 'monthly',
    lemonSqueezyVariantId: 'unlimited-variant-id', // To be created
    features: [
      'Prendas ilimitadas',
      'Todas las funciones Pro',
      'Estadísticas avanzadas',
      'Exportación avanzada',
      'Soporte VIP'
    ]
  }
};

export const ITEM_PACKS: Record<string, ItemPack> = {
  SMALL: {
    id: 'pack-100',
    name: 'Pack Extra',
    items: 100,
    price: 14.99,
    currency: 'MXN',
    billingPeriod: 'one-time',
    lemonSqueezyVariantId: 'pack-100-variant-id', // To be created
    description: '+100 prendas adicionales'
  },
  MEDIUM: {
    id: 'pack-500',
    name: 'Pack Mega',
    items: 500,
    price: 49.99,
    currency: 'MXN',
    billingPeriod: 'one-time',
    lemonSqueezyVariantId: 'pack-500-variant-id', // To be created
    description: '+500 prendas adicionales'
  },
  LARGE: {
    id: 'pack-1000',
    name: 'Pack Max',
    items: 1000,
    price: 79.99,
    currency: 'MXN',
    billingPeriod: 'one-time',
    lemonSqueezyVariantId: 'pack-1000-variant-id', // To be created
    description: '+1000 prendas adicionales'
  }
};

export type PlanId = typeof PRICING_PLANS[keyof typeof PRICING_PLANS]['id'];
export type ItemPackId = typeof ITEM_PACKS[keyof typeof ITEM_PACKS]['id'];

/**
 * Calculate total item limit for a user
 */
export function calculateItemLimit(subscription?: SubscriptionDetails, itemPacks?: ItemPackPurchase[]): number {
  const planId = subscription?.planId || 'free';
  const plan = Object.values(PRICING_PLANS).find(p => p.id === planId);
  if (!plan) return PRICING_PLANS.FREE.baseItemLimit;

  const packItems = (itemPacks || []).reduce((total, pack) => total + pack.itemsAdded, 0);
  return plan.baseItemLimit + packItems;
}

/**
 * Get current plan details
 */
export function getPlanDetails(planId: PlanId) {
  return Object.values(PRICING_PLANS).find(p => p.id === planId) || PRICING_PLANS.FREE;
}

/**
 * Get item pack details
 */
export function getItemPackDetails(packId: ItemPackId) {
  return Object.values(ITEM_PACKS).find(p => p.id === packId);
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
