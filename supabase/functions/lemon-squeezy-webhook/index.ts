import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createHmac } from "https://deno.land/std@0.168.0/hash/mod.ts"

/**
 * Lemon Squeezy Webhook Handler for "¿Qué Me Pongo?"
 * 
 * Handles:
 * - Subscription purchases (Pro, Unlimited)
 * - Item pack purchases (Pack Extra, Pack Mega, Pack Max)
 * - Subscription cancellations/expirations
 * 
 * Expected payload structure:
 * {
 *   meta: {
 *     event_name: string,
 *     custom_data: { user_id: string }
 *   },
 *   data: {
 *     attributes: {
 *       variant_id: string,
 *       product_name: string,
 *       status: string,
 *       // For subscriptions
 *       subscription_id?: string,
 *       renews_at?: string,
 *       ends_at?: string,
 *       // For orders
 *       order_id?: string
 *     }
 *   }
 * }
 */

const LE_SECRET = Deno.env.get('LEMON_SQUEEZY_SIGNING_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Product/Variant ID mappings
const SUBSCRIPTION_VARIANTS = {
    // Update these with your actual Lemon Squeezy variant IDs
    '2131fda6-1821-42d0-a7a0-c9eac6dd29ae': 'pro', // Existing Pro variant
    // Add Unlimited variant ID when created
    // 'unlimited-variant-id': 'unlimited',
} as Record<string, 'pro' | 'unlimited'>

const ITEM_PACK_VARIANTS = {
    // Update these with your actual Lemon Squeezy variant IDs
    // 'pack-100-variant-id': { packId: 'pack-100', itemsAdded: 100 },
    // 'pack-500-variant-id': { packId: 'pack-500', itemsAdded: 500 },
    // 'pack-1000-variant-id': { packId: 'pack-1000', itemsAdded: 1000 },
} as Record<string, { packId: string; itemsAdded: number }>

// Helper function to verify webhook signature
function verifySignature(body: string, signature: string, secret: string): boolean {
    try {
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const messageData = encoder.encode(body)
        
        return new Promise((resolve) => {
            crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            ).then((key) => {
                crypto.subtle.sign('HMAC', key, messageData).then((signatureBuffer) => {
                    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
                    const computedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')
                    resolve(computedSignature === signature)
                }).catch(() => resolve(false))
            }).catch(() => resolve(false))
        })
    } catch {
        return false
    }
}

serve(async (req) => {
    const signature = req.headers.get('x-signature')
    
    if (!signature || !LE_SECRET) {
        console.error('[Webhook] Missing signature or secret')
        return new Response('Unauthorized', { status: 401 })
    }

    const rawBody = await req.text()
    
    // Verify signature
    const isValid = await verifySignature(rawBody, signature, LE_SECRET)
    if (!isValid) {
        console.error('[Webhook] Invalid signature')
        return new Response('Invalid signature', { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const eventName = body.meta?.event_name
    const userId = body.meta?.custom_data?.user_id

    console.log(`[Webhook] Received event: ${eventName} for user: ${userId}`)

    if (!userId) {
        console.error('[Webhook] No user_id in custom_data')
        return new Response('No user_id in custom_data', { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // Handle subscription events
        if (eventName === 'subscription_created') {
            await handleSubscriptionCreated(supabase, userId, body)
        } else if (eventName === 'subscription_updated') {
            await handleSubscriptionUpdated(supabase, userId, body)
        } else if (eventName === 'subscription_cancelled') {
            await handleSubscriptionCancelled(supabase, userId, body)
        } else if (eventName === 'subscription_expired') {
            await handleSubscriptionExpired(supabase, userId, body)
        } 
        // Handle one-time order events (item packs)
        else if (eventName === 'order_created') {
            await handleOrderCreated(supabase, userId, body)
        } else {
            console.log(`[Webhook] Unhandled event type: ${eventName}`)
        }

        return new Response('Webhook processed successfully', { status: 200 })
    } catch (error) {
        console.error('[Webhook] Error processing:', error)
        return new Response(`Error: ${error.message}`, { status: 500 })
    }
})

async function handleSubscriptionCreated(
    supabase: any,
    userId: string,
    body: any
) {
    const variantId = body.data?.attributes?.variant_id
    const planId = SUBSCRIPTION_VARIANTS[variantId]
    
    if (!planId) {
        console.warn(`[Webhook] Unknown subscription variant: ${variantId}`)
        return
    }

    const subscriptionData = {
        planId,
        startDate: new Date().toISOString(),
        lemonSqueezyOrderId: body.data?.attributes?.subscription_id || body.data?.attributes?.order_id,
        status: 'active' as const
    }

    console.log(`[Webhook] Upgrading user ${userId} to ${planId} plan`)

    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_plan_id: planId,
            subscription_start_date: subscriptionData.startDate,
            subscription_lemon_squeezy_order_id: subscriptionData.lemonSqueezyOrderId,
            subscription_status: subscriptionData.status,
            // Keep isPro for backward compatibility
            is_pro: planId !== 'free'
        })
        .eq('id', userId)

    if (error) {
        console.error('[Webhook] Error updating subscription:', error)
        throw error
    }
}

async function handleSubscriptionUpdated(
    supabase: any,
    userId: string,
    body: any
) {
    const status = body.data?.attributes?.status
    
    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_status: status,
            subscription_end_date: body.data?.attributes?.ends_at || null
        })
        .eq('id', userId)

    if (error) {
        console.error('[Webhook] Error updating subscription status:', error)
        throw error
    }
}

async function handleSubscriptionCancelled(
    supabase: any,
    userId: string,
    body: any
) {
    console.log(`[Webhook] Cancelling subscription for user ${userId}`)

    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_status: 'cancelled',
            subscription_end_date: body.data?.attributes?.ends_at || null,
            // Keep isPro until subscription actually expires
            is_pro: true
        })
        .eq('id', userId)

    if (error) {
        console.error('[Webhook] Error cancelling subscription:', error)
        throw error
    }
}

async function handleSubscriptionExpired(
    supabase: any,
    userId: string,
    body: any
) {
    console.log(`[Webhook] Subscription expired for user ${userId}`)

    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_plan_id: 'free',
            subscription_status: 'expired',
            subscription_end_date: new Date().toISOString(),
            is_pro: false
        })
        .eq('id', userId)

    if (error) {
        console.error('[Webhook] Error expiring subscription:', error)
        throw error
    }
}

async function handleOrderCreated(
    supabase: any,
    userId: string,
    body: any
) {
    const variantId = body.data?.attributes?.variant_id
    const packInfo = ITEM_PACK_VARIANTS[variantId]
    
    if (!packInfo) {
        console.warn(`[Webhook] Unknown item pack variant: ${variantId}`)
        // Check if this is a subscription purchase (old format)
        if (SUBSCRIPTION_VARIANTS[variantId]) {
            await handleSubscriptionCreated(supabase, userId, body)
        }
        return
    }

    console.log(`[Webhook] User ${userId} purchased item pack: ${packInfo.packId} (+${packInfo.itemsAdded} items)`)

    // Get current item packs
    const { data: profileData } = await supabase
        .from('profiles')
        .select('item_packs')
        .eq('id', userId)
        .single()

    const currentPacks = profileData?.item_packs || []
    
    // Add new pack to array
    const newPack = {
        packId: packInfo.packId,
        purchaseDate: new Date().toISOString(),
        lemonSqueezyOrderId: body.data?.attributes?.order_id,
        itemsAdded: packInfo.itemsAdded
    }

    const updatedPacks = [...currentPacks, newPack]

    const { error } = await supabase
        .from('profiles')
        .update({
            item_packs: updatedPacks
        })
        .eq('id', userId)

    if (error) {
        console.error('[Webhook] Error adding item pack:', error)
        throw error
    }

    console.log(`[Webhook] Successfully added item pack to user ${userId}`)
}
