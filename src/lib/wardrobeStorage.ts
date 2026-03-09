import { db } from './db';
import { supabase } from './supabase';
import type { ClothingItem, WeeklyPlan, UserProfile } from '../types';

const IMAGE_BUCKET = 'wardrobe-images';

// --- Helpers ---

/**
 * Returns the current user ID or null if not logged in.
 * Uses getSession for faster check then getUser for security.
 */
async function getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// --- Image Storage ---

/**
 * Converts a base64 data URL to a File object.
 */
function base64ToFile(base64: string, filename: string): File {
    const [header, data] = base64.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new File([ab], filename, { type: mime });
}

import { resizeImage } from './imageResizer';

/**
 * Uploads a base64 image to Supabase Storage and returns the public URL.
 * Automatically resizes and compresses the image before upload.
 */
export async function uploadImage(base64Image: string, userId: string): Promise<string> {
    // Optimize image (resize to max 1200px, 70% quality)
    const optimizedBase64 = await resizeImage(base64Image, 1200, 1200, 0.7);

    const ext = optimizedBase64.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const file = base64ToFile(optimizedBase64, filename);

    const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filename, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filename);

    return urlData.publicUrl;
}

/**
 * Deletes an image from Supabase Storage given its public URL.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
    try {
        const marker = `/object/public/${IMAGE_BUCKET}/`;
        const idx = imageUrl.indexOf(marker);
        if (idx === -1) return;
        const path = imageUrl.substring(idx + marker.length);
        await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    } catch (err) {
        console.error('Error deleting image from storage:', err);
    }
}

// --- Wardrobe CRUD ---

/**
 * Loads the wardrobe. 
 * If logged in: Syncs cloud -> local cache and returns cloud data.
 * If offline: Returns local cache.
 */
export async function loadWardrobe(): Promise<ClothingItem[]> {
    const userId = await getUserId();

    if (userId) {
        // 1. First, check if there's anything local to sync TO cloud
        await syncLocalDataToCloud(userId);

        // 2. Fetch from Cloud
        const { data, error } = await supabase
            .from('wardrobe')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // 3. Update Local Cache strictly to match Cloud
            await db.wardrobe.clear();
            await db.wardrobe.bulkPut(data);
            return data as ClothingItem[];
        }
        
        if (error) console.error('Supabase load error:', error);
    }

    // Fallback to local cache (Dexie)
    return await db.wardrobe.toArray();
}

/**
 * Adds a new item.
 * Architecture: Update Cloud, then Update Local Cache.
 */
export async function addClothingItem(item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> {
    const userId = await getUserId();

    if (userId) {
        // Cloud First
        const { data, error } = await supabase
            .from('wardrobe')
            .insert([{ ...item, user_id: userId }])
            .select()
            .single();

        if (error) {
            console.error('Error adding to Supabase:', error);
            throw error;
        }

        // Sync to local cache immediately
        const newItem = data as ClothingItem;
        await db.wardrobe.put(newItem);
        return newItem;
    }

    // Offline mode: Dexie Only
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: ClothingItem = {
        ...item,
        id: localId,
        created_at: new Date().toISOString()
    };
    await db.wardrobe.add(newItem);
    return newItem;
}

export async function updateClothingItem(id: string, updates: Partial<ClothingItem>): Promise<void> {
    const userId = await getUserId();

    if (userId && !id.startsWith('local-')) {
        const { error } = await supabase
            .from('wardrobe')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId);
        
        if (error) throw error;
    }

    // Always update local cache
    await db.wardrobe.update(id, updates);
}

export async function deleteClothingItem(id: string, imageUrl?: string): Promise<boolean> {
    const userId = await getUserId();
    let deletedSuccessfully = false;

    if (userId && !id.startsWith('local-')) {
        const { error } = await supabase
            .from('wardrobe')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (!error) {
            deletedSuccessfully = true;
            if (imageUrl) await deleteImage(imageUrl);
        } else {
            console.error('Supabase delete error:', error);
        }
    }

    // Always attempt local deletion regardless of cloud result (to keep UI snappy)
    const del1 = await db.wardrobe.where('id').equals(id).delete();
    const del2 = await db.wardrobe.where('id').equals(Number(id) as any).delete();
    
    return deletedSuccessfully || del1 > 0 || del2 > 0;
}

// --- Weekly Plan ---

export async function loadWeeklyPlan(): Promise<WeeklyPlan> {
    const userId = await getUserId();

    if (userId) {
        const { data, error } = await supabase
            .from('plans')
            .select('plan_data')
            .eq('user_id', userId)
            .single();

        if (!error && data) {
            const plan = data.plan_data || {};
            await db.plans.put({ id: 'weekly-plan', plan_data: plan });
            return plan;
        }
    }

    const record = await db.plans.get('weekly-plan');
    return record?.plan_data || {};
}

export async function saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    const userId = await getUserId();

    if (userId) {
        await supabase
            .from('plans')
            .upsert({ user_id: userId, plan_data: plan }, { onConflict: 'user_id' });
    }

    await db.plans.put({ id: 'weekly-plan', plan_data: plan });
}

// --- User Profile ---

export async function loadUserProfile(): Promise<UserProfile> {
    const userId = await getUserId();

    if (userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!error && data) {
            const profile: UserProfile = {
                name: data.name ?? undefined,
                sex: data.sex ?? undefined,
                age: data.age ?? undefined,
                weight: data.weight ?? undefined,
                height: data.height ?? undefined,
                isPro: data.is_pro ?? false,
            };
            await db.profiles.put({ id: 'user-profile', profile_data: profile });
            return profile;
        }
    }

    const record = await db.profiles.get('user-profile');
    return record?.profile_data || {};
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
    const userId = await getUserId();

    if (userId) {
        await supabase
            .from('profiles')
            .upsert({
                user_id: userId,
                name: profile.name || null,
                sex: profile.sex || null,
                age: profile.age || null,
                weight: profile.weight || null,
                height: profile.height || null,
                is_pro: profile.isPro ?? false,
            }, { onConflict: 'user_id' });
    }

    await db.profiles.put({ id: 'user-profile', profile_data: profile });
}

// --- Sync & Migration ---

/**
 * Migration helper to move any local-only data to Supabase when a user logs in.
 */
export async function syncLocalDataToCloud(userId: string): Promise<void> {
    // 1. Sync Wardrobe
    const localItems = await db.wardrobe.toArray();
    const itemsToMigrate = localItems.filter(i => i.id.startsWith('local-'));
    
    if (itemsToMigrate.length > 0) {
        console.log(`Migrating ${itemsToMigrate.length} items to Supabase...`);
        const cleanItems = itemsToMigrate.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
        const { error } = await supabase.from('wardrobe').insert(cleanItems);
        if (!error) {
            // After successful migration, local cache will be overwritten by cloud data in loadWardrobe
            console.log('Migration successful.');
        }
    }

    // 2. Sync Plan
    const localPlan = await db.plans.get('weekly-plan');
    if (localPlan) {
        await supabase.from('plans').upsert({ user_id: userId, plan_data: localPlan.plan_data }, { onConflict: 'user_id' });
    }

    // 3. Sync Profile
    const localProfile = await db.profiles.get('user-profile');
    if (localProfile) {
        await saveUserProfile(localProfile.profile_data);
    }
}

// --- Clear / Export / Import ---

export async function clearAllData(): Promise<void> {
    const userId = await getUserId();
    
    await db.wardrobe.clear();
    await db.plans.clear();
    await db.profiles.clear();
    await db.appSettings.clear();
    
    if (userId) {
        const { data: items } = await supabase.from('wardrobe').select('image').eq('user_id', userId);
        if (items) {
            for (const item of items) {
                if (item.image) await deleteImage(item.image);
            }
        }
        await supabase.from('wardrobe').delete().eq('user_id', userId);
        await supabase.from('plans').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('user_id', userId);
    }
    
    localStorage.clear(); // Nuclear option
}

export async function exportAllData(): Promise<string> {
    const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        wardrobe: await loadWardrobe(),
        weeklyPlan: await loadWeeklyPlan(),
        userProfile: await loadUserProfile(),
    };
    return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    const userId = await getUserId();

    if (userId) {
        if (data.wardrobe) {
            const wardrobeToImport = [];
            for (const item of data.wardrobe) {
                const { id, ...rest } = item;
                let image = rest.image;
                if (image && image.startsWith('data:')) {
                    try { image = await uploadImage(image, userId); } catch (err) { console.error(err); }
                }
                wardrobeToImport.push({ ...rest, image, user_id: userId });
            }
            await supabase.from('wardrobe').insert(wardrobeToImport);
        }
        if (data.weeklyPlan) await saveWeeklyPlan(data.weeklyPlan);
        if (data.userProfile) await saveUserProfile(data.userProfile);
    } else {
        if (data.wardrobe) await db.wardrobe.bulkPut(data.wardrobe);
        if (data.weeklyPlan) await db.plans.put({ id: 'weekly-plan', plan_data: data.weeklyPlan });
        if (data.userProfile) await db.profiles.put({ id: 'user-profile', profile_data: data.userProfile });
    }
}
