
import { supabase } from './supabase';
import type { ClothingItem, WeeklyPlan, UserProfile } from '../types';

const WARDROBE_KEY = 'que-me-pongo:wardrobe';
const WEEKLY_PLAN_KEY = 'que-me-pongo:weekly-plan';
const USER_PROFILE_KEY = 'que-me-pongo:user-profile';
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

/**
 * Uploads a base64 image to Supabase Storage and returns the public URL.
 */
export async function uploadImage(base64Image: string, userId: string): Promise<string> {
    const ext = base64Image.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const file = base64ToFile(base64Image, filename);

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

    // LocalStorage Fallback
    try {
        const raw = localStorage.getItem(WARDROBE_KEY);
        if (!raw) {
            const legacy = localStorage.getItem('cc_items');
            if (legacy) return JSON.parse(legacy);
        }
        return raw ? JSON.parse(raw) : [];
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

    // LocalStorage
    const newItem: ClothingItem = {
        ...item,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    const wardrobe = await loadWardrobe();
    const updated = [...wardrobe, newItem];
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(updated));
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

    // LocalStorage
    const wardrobe = await loadWardrobe();
    const updated = wardrobe.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(updated));
}

export async function deleteClothingItem(id: string, imageUrl?: string): Promise<void> {
    const userId = await getUserId();

    if (userId && !id.startsWith('local-')) {
        // Delete image from Storage first
        if (imageUrl) {
            await deleteImage(imageUrl);
        }

        const { error } = await supabase
            .from('wardrobe')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return;
    }

    // LocalStorage
    const wardrobe = await loadWardrobe();
    const filtered = wardrobe.filter(item => item.id !== id);
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(filtered));
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

    // Local Fallback
    try {
        const raw = localStorage.getItem(WEEKLY_PLAN_KEY);
        if (raw) return JSON.parse(raw);
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

    localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(plan));
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
            };
        }
    }

    // LocalStorage fallback
    try {
        const raw = localStorage.getItem(USER_PROFILE_KEY);
        return raw ? JSON.parse(raw) : {};
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
            }, { onConflict: 'user_id' });
        if (error) {
            console.error('Error saving profile to Supabase:', error);
        }
        return;
    }

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
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
        // Import to LocalStorage
        if (data.wardrobe) localStorage.setItem(WARDROBE_KEY, JSON.stringify(data.wardrobe));
        if (data.weeklyPlan) localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(data.weeklyPlan));
        if (data.userProfile) localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.userProfile));
    }
}
