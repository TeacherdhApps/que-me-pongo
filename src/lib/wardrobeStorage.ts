
import { db } from './db';
import { supabase } from './supabase';
import type { ClothingItem, WeeklyPlan, UserProfile } from '../types';

const IMAGE_BUCKET = 'wardrobe-images';

// --- Helpers ---

async function getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
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
        // Extract the path after /object/public/wardrobe-images/
        const marker = `/object/public/${IMAGE_BUCKET}/`;
        const idx = imageUrl.indexOf(marker);
        if (idx === -1) return; // Not a Supabase Storage URL, skip
        const path = imageUrl.substring(idx + marker.length);
        await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    } catch (err) {
        console.error('Error deleting image from storage:', err);
    }
}

// --- Wardrobe CRUD ---

export async function loadWardrobe(): Promise<ClothingItem[]> {
    const userId = await getUserId();

    if (userId) {
        // --- Sync Logic: Move local items to Supabase if they exist ---
        const localItems = await db.wardrobe.toArray();
        if (localItems.length > 0) {
            console.log(`Syncing ${localItems.length} local items to Supabase for user ${userId}`);
            const itemsToSync = localItems.map(item => {
                const { id, ...rest } = item;
                // If it's a local ID, let Supabase generate a new one
                // Otherwise, keep the ID if it's already a UUID (from a previous export/import)
                if (id.startsWith('local-')) {
                    return { ...rest, user_id: userId };
                }
                return { ...item, user_id: userId };
            });

            const { error: syncError } = await supabase
                .from('wardrobe')
                .upsert(itemsToSync, { onConflict: 'id' }); // Use upsert to avoid duplicates

            if (!syncError) {
                // Clear local items after successful sync
                await db.wardrobe.clear();
                console.log('Local wardrobe synced and cleared.');
            } else {
                console.error('Error syncing wardrobe:', syncError);
            }
        }

        const { data, error } = await supabase
            .from('wardrobe')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading from Supabase:', error);
            // Fallback to cache if offline
            return await db.wardrobe.toArray();
        }

        // Update local cache to match exactly what is in Supabase
        await db.wardrobe.clear();
        if (data && data.length > 0) {
            await db.wardrobe.bulkPut(data);
        }
        
        return data as ClothingItem[];
    }

    // Dexie Fallback
    try {
        const migrated = await db.appSettings.get('wardrobe-migrated');
        const localItems = await db.wardrobe.toArray();

        // If already migrated and empty, it's valid empty state
        if (migrated && localItems.length === 0) return [];
        // If there are items, return them
        if (localItems.length > 0) return localItems;

        // Migrate from localStorage if needed
        let raw = localStorage.getItem('que-me-pongo:wardrobe');
        if (!raw) raw = localStorage.getItem('cc_items');

        if (raw) {
            const parsed = JSON.parse(raw);
            const items = Array.isArray(parsed) ? parsed : [];
            await db.wardrobe.bulkPut(items);
            await db.appSettings.put({ id: 'wardrobe-migrated', value: true });
            localStorage.removeItem('que-me-pongo:wardrobe');
            localStorage.removeItem('cc_items');
            return items;
        }

        // Mark as migrated even if nothing was in localStorage
        await db.appSettings.put({ id: 'wardrobe-migrated', value: true });
        return [];
    } catch {
        return [];
    }
}

export async function addClothingItem(item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> {
    const userId = await getUserId();

    if (userId) {
        const { data, error } = await supabase
            .from('wardrobe')
            .insert([{ ...item, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data as ClothingItem;
    }

    // Dexie Storage
    const newItem: ClothingItem = {
        ...item,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString()
    };
    try {
        await db.wardrobe.add(newItem);
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            throw error;
        }
        throw error;
    }
    return newItem;
}

export async function updateClothingItem(id: string, updates: Partial<ClothingItem>): Promise<void> {
    const userId = await getUserId();

    if (userId && !id.startsWith('local-')) {
        const { error } = await supabase
            .from('wardrobe')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
        return;
    }

    // Dexie Storage
    try {
        await db.wardrobe.update(id, updates);
        await db.wardrobe.update(Number(id) as any, updates); // Fallback for numeric IDs from legacy localStorage
    } catch (error: any) {
        if (error?.name === 'QuotaExceededError') {
            throw error;
        }
        console.error('Dexie update error:', error);
    }
}

export async function deleteClothingItem(id: string, imageUrl?: string): Promise<boolean> {
    const userId = await getUserId();

    if (userId && !id.startsWith('local-')) {
        console.log(`Attempting to delete item ${id} for user ${userId}`);

        // Delete from DB first. We use .eq('user_id', userId) as a safety measure
        // even if RLS is enabled, to ensure we only affect the user's own data.
        const { error, count } = await supabase
            .from('wardrobe')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting from Supabase:', error);
            throw error;
        }

        // If count is 0, it means no rows were deleted (maybe already gone or wrong user)
        if (count === 0) {
            console.warn(`No item found to delete with id ${id} for user ${userId}. Continuing as successful.`);
        }

        // Always attempt to delete the image if provided
        if (imageUrl) {
            await deleteImage(imageUrl);
        }

        return true;
    }

    // Dexie Storage
    console.log(`Deleting local item ${id}`);
    try {
        // Attempt deletion of both string and numeric IDs
        const result1 = await db.wardrobe.where('id').equals(id).delete();
        const result2 = await db.wardrobe.where('id').equals(Number(id) as any).delete();
        return result1 > 0 || result2 > 0;
    } catch (err) {
        console.error('Error deleting from Dexie:', err);
        return false;
    }
}

// --- Weekly Plan ---

export async function loadWeeklyPlan(): Promise<WeeklyPlan> {
    const userId = await getUserId();

    if (userId) {
        // --- Sync Logic: Move local plan to Supabase if it exists ---
        const localPlan = await db.plans.get('weekly-plan');
        if (localPlan) {
            console.log(`Syncing local plan to Supabase for user ${userId}`);
            const { error: syncError } = await supabase
                .from('plans')
                .upsert({ user_id: userId, plan_data: localPlan.plan_data }, { onConflict: 'user_id' });

            if (!syncError) {
                await db.plans.delete('weekly-plan');
                console.log('Local plan synced and cleared.');
            } else {
                console.error('Error syncing plan:', syncError);
            }
        }

        const { data, error } = await supabase
            .from('plans')
            .select('plan_data')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading plan from Supabase:', error);
        }
        return data?.plan_data || {};
    }

    // Dexie Fallback
    try {
        const migrated = await db.appSettings.get('plans-migrated');
        let record = await db.plans.get('weekly-plan');

        if (migrated && !record) return {};
        if (record) return record.plan_data;

        // Migrate from localStorage
        const fallback = localStorage.getItem('que-me-pongo:weekly-plan');
        if (fallback) {
            const parsed = JSON.parse(fallback);
            await db.plans.put({ id: 'weekly-plan', plan_data: parsed });
            await db.appSettings.put({ id: 'plans-migrated', value: true });
            localStorage.removeItem('que-me-pongo:weekly-plan');
            return parsed;
        }
        await db.appSettings.put({ id: 'plans-migrated', value: true });
        return {};
    } catch {
        return {};
    }
}

export async function saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    const userId = await getUserId();

    if (userId) {
        const { error } = await supabase
            .from('plans')
            .upsert({ user_id: userId, plan_data: plan }, { onConflict: 'user_id' });
        if (error) throw error;
        return;
    }

    try {
        await db.plans.put({ id: 'weekly-plan', plan_data: plan });
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            throw error;
        }
        throw error;
    }
}

// --- User Profile ---

export async function loadUserProfile(): Promise<UserProfile> {
    const userId = await getUserId();

    if (userId) {
        // --- Sync Logic: Move local profile to Supabase if it exists ---
        const localProfile = await db.profiles.get('user-profile');
        if (localProfile) {
            console.log(`Syncing local profile to Supabase for user ${userId}`);
            const { error: syncError } = await supabase
                .from('profiles')
                .upsert({
                    user_id: userId,
                    name: localProfile.profile_data.name || null,
                    sex: localProfile.profile_data.sex || null,
                    age: localProfile.profile_data.age || null,
                    weight: localProfile.profile_data.weight || null,
                    height: localProfile.profile_data.height || null,
                    is_pro: localProfile.profile_data.isPro ?? false,
                }, { onConflict: 'user_id' });

            if (!syncError) {
                await db.profiles.delete('user-profile');
                console.log('Local profile synced and cleared.');
            } else {
                console.error('Error syncing profile:', syncError);
            }
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading profile from Supabase:', error);
        }
        if (data) {
            return {
                name: data.name ?? undefined,
                sex: data.sex ?? undefined,
                age: data.age ?? undefined,
                weight: data.weight ?? undefined,
                height: data.height ?? undefined,
                isPro: data.is_pro ?? false,
            };
        }
    }

    // Dexie Fallback
    try {
        let record = await db.profiles.get('user-profile');
        if (record) return record.profile_data;

        // Migrate from localStorage
        const fallback = localStorage.getItem('que-me-pongo:user-profile');
        if (fallback) {
            const parsed = JSON.parse(fallback);
            await db.profiles.put({ id: 'user-profile', profile_data: parsed });
            localStorage.removeItem('que-me-pongo:user-profile');
            return parsed;
        }
        return {};
    } catch {
        return {};
    }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
    const userId = await getUserId();

    if (userId) {
        const { error } = await supabase
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
        if (error) {
            console.error('Error saving profile to Supabase:', error);
        }
        return;
    }

    try {
        await db.profiles.put({ id: 'user-profile', profile_data: profile });
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            throw error;
        }
        throw error;
    }
}

// --- Export / Import / Clear ---

export async function clearAllData(): Promise<void> {
    const userId = await getUserId();
    
    // 1. Clear local Dexie DB
    await db.wardrobe.clear();
    await db.plans.clear();
    await db.profiles.clear();
    await db.appSettings.clear();
    
    // 2. Clear Supabase if user is logged in
    if (userId) {
        // We delete wardrobe items first
        const { data: items } = await supabase.from('wardrobe').select('image').eq('user_id', userId);
        
        // Delete images from storage
        if (items) {
            for (const item of items) {
                if (item.image) await deleteImage(item.image);
            }
        }
        
        await supabase.from('wardrobe').delete().eq('user_id', userId);
        await supabase.from('plans').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('user_id', userId);
    }
    
    // 3. Clear localStorage (legacy)
    localStorage.removeItem('que-me-pongo:wardrobe');
    localStorage.removeItem('que-me-pongo:weekly-plan');
    localStorage.removeItem('que-me-pongo:user-profile');
    localStorage.removeItem('cc_items');
}

export async function exportAllData(): Promise<string> {
    const data = {
        version: 1,
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
        // Import to Supabase
        if (data.wardrobe) {
            const wardrobeToImport = [];
            for (const item of data.wardrobe) {
                const { id, ...rest } = item;
                let image = rest.image;
                // Upload base64 images to Storage
                if (image && image.startsWith('data:')) {
                    try {
                        image = await uploadImage(image, userId);
                    } catch (err) {
                        console.error('Error uploading image during import:', err);
                    }
                }
                wardrobeToImport.push({ ...rest, image, user_id: userId });
            }
            await supabase.from('wardrobe').insert(wardrobeToImport);
        }
        if (data.weeklyPlan) {
            await saveWeeklyPlan(data.weeklyPlan);
        }
        if (data.userProfile) {
            await saveUserProfile(data.userProfile);
        }
    } else {
        // Import to Dexie
        if (data.wardrobe) await db.wardrobe.bulkPut(data.wardrobe);
        if (data.weeklyPlan) await db.plans.put({ id: 'weekly-plan', plan_data: data.weeklyPlan });
        if (data.userProfile) await db.profiles.put({ id: 'user-profile', profile_data: data.userProfile });
    }
}
