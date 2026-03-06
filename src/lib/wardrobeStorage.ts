
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
        const { data, error } = await supabase
            .from('wardrobe')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading from Supabase:', error);
            return [];
        }
        return data as ClothingItem[];
    }

    // Dexie Fallback
    try {
        const localItems = await db.wardrobe.toArray();
        if (localItems.length > 0) return localItems;

        // Migrate from localStorage if needed
        let raw = localStorage.getItem('que-me-pongo:wardrobe');
        if (!raw) raw = localStorage.getItem('cc_items');

        if (raw) {
            const parsed = JSON.parse(raw);
            const items = Array.isArray(parsed) ? parsed : [];
            await db.wardrobe.bulkPut(items);
            localStorage.removeItem('que-me-pongo:wardrobe');
            localStorage.removeItem('cc_items');
            return items;
        }
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
            console.warn(`No item found to delete with id ${id} for user ${userId}`);
            return false;
        }

        // Only delete the image if the database record was successfully removed
        if (imageUrl) {
            await deleteImage(imageUrl);
        }

        return true;
    }

    // Dexie Storage
    console.log(`Deleting local item ${id}`);
    try {
        await db.wardrobe.delete(id);
        await db.wardrobe.delete(Number(id) as any); // Fallback for numeric IDs
        return true;
    } catch (err) {
        console.error('Error deleting from Dexie:', err);
        return false;
    }
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

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading plan from Supabase:', error);
        }
        return data?.plan_data || {};
    }

    // Dexie Fallback
    try {
        let record = await db.plans.get('weekly-plan');
        if (record) return record.plan_data;

        // Migrate from localStorage
        const fallback = localStorage.getItem('que-me-pongo:weekly-plan');
        if (fallback) {
            const parsed = JSON.parse(fallback);
            await db.plans.put({ id: 'weekly-plan', plan_data: parsed });
            localStorage.removeItem('que-me-pongo:weekly-plan');
            return parsed;
        }
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

// --- Export / Import ---

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
