import { db } from './db';
import { supabase } from './supabase';
import type { ClothingItem, WeeklyPlan, UserProfile } from '../types';

const IMAGE_BUCKET = 'wardrobe-images';

// --- Helpers ---

async function getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// --- Image Storage ---

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

import { resizeImage, generateThumbnail } from './imageResizer';

export async function uploadImage(
    base64Image: string,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    onProgress?.(10);
    const optimizedBase64 = await resizeImage(base64Image, 1200, 1200, 0.7);
    onProgress?.(40);
    const ext = optimizedBase64.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const file = base64ToFile(optimizedBase64, filename);

    onProgress?.(60);
    const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filename, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    onProgress?.(90);
    const { data: urlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filename);

    onProgress?.(100);
    return urlData.publicUrl;
}

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

export async function loadWardrobe(): Promise<ClothingItem[]> {
    const userId = await getUserId();

    if (userId) {
        // Run sync in background, don't block load
        syncLocalDataToCloud(userId).catch(console.error);

        const { data, error } = await supabase
            .from('wardrobe')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Merge with local items that haven't synced yet
            const localItems = await db.wardrobe.toArray();
            const unSynced = localItems.filter(i => i.id.startsWith('local-'));
            
            await db.wardrobe.clear();
            await db.wardrobe.bulkPut([...data, ...unSynced]);
            return [...data, ...unSynced] as ClothingItem[];
        }
    }
    return await db.wardrobe.toArray();
}

/**
 * Strategy: Save to Dexie instantly, then attempt cloud sync.
 * This ensures the item never "disappears" even if internet is slow.
 */
export async function addClothingItem(item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> {
    const userId = await getUserId();
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Generate tiny placeholder if image is base64 (new upload)
    let thumbnail = undefined;
    if (item.image.startsWith('data:')) {
        try {
            thumbnail = await generateThumbnail(item.image);
        } catch (e) {
            console.error('Thumbnail generation failed', e);
        }
    }

    const newItem: ClothingItem = {
        ...item,
        id: localId,
        thumbnail,
        created_at: new Date().toISOString()
    };

    // 1. Save to local cache IMMEDIATELY
    await db.wardrobe.add(newItem);

    // 2. If logged in, attempt background sync
    if (userId) {
        // We don't "await" this long process to keep UI snappy, 
        // but we return the newItem so TanStack Query can track it.
        syncLocalDataToCloud(userId).catch(console.error);
    }

    return newItem;
}

export async function updateClothingItem(id: string, updates: Partial<ClothingItem>): Promise<void> {
    const userId = await getUserId();
    await db.wardrobe.update(id, updates);
    if (userId && !id.startsWith('local-')) {
        await supabase.from('wardrobe').update(updates).eq('id', id).eq('user_id', userId);
    }
}

export async function deleteClothingItem(id: string, imageUrl?: string): Promise<void> {
    const userId = await getUserId();
    // Delete local cache instantly
    await db.wardrobe.where('id').equals(id).delete();
    // Support numeric IDs if they exist (old schema)
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
        await db.wardrobe.where('id').equals(numericId).delete();
    }

    // Background cloud delete
    if (userId && !id.startsWith('local-')) {
        await supabase.from('wardrobe').delete().eq('id', id).eq('user_id', userId);
        if (imageUrl) await deleteImage(imageUrl);
    }
}

// --- Weekly Plan ---

export async function loadWeeklyPlan(): Promise<WeeklyPlan> {
    const userId = await getUserId();
    const localRecord = await db.plans.get('weekly-plan');
    const localPlan = localRecord?.plan_data || {};

    if (userId) {
        try {
            const { data, error } = await supabase.from('plans').select('plan_data').eq('user_id', userId).single();
            if (!error && data) {
                const cloudPlan = data.plan_data || {};
                
                // Simple merge strategy: if local is empty, use cloud.
                // Otherwise, we'd need timestamps to know which is newer.
                // For now, let's at least not overwrite if local has something and cloud is empty.
                if (Object.keys(localPlan).length === 0 && Object.keys(cloudPlan).length > 0) {
                    await db.plans.put({ id: 'weekly-plan', plan_data: cloudPlan });
                    return cloudPlan;
                }
                
                // If both have data, we'll favor cloud for now but this is where 
                // a more sophisticated sync/merge would go.
                if (Object.keys(cloudPlan).length > 0) {
                    await db.plans.put({ id: 'weekly-plan', plan_data: cloudPlan });
                    return cloudPlan;
                }
            }
        } catch (err) {
            console.error('Error loading plan from cloud, using local:', err);
        }
    }
    return localPlan;
}

export async function saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    const userId = await getUserId();
    // 1. Save to local Dexie IMMEDIATELY
    await db.plans.put({ id: 'weekly-plan', plan_data: plan });
    
    // 2. If online and logged in, sync to Supabase
    if (userId) {
        const { error } = await supabase.from('plans').upsert({ 
            user_id: userId, 
            plan_data: plan
        }, { onConflict: 'user_id' });
        
        if (error) {
            console.error('Error syncing plan to Supabase:', error);
            // We don't throw here to allow offline mode to work
        }
    }
}

// --- User Profile ---

export async function loadUserProfile(): Promise<UserProfile> {
    const userId = await getUserId();
    if (userId) {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
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
    await db.profiles.put({ id: 'user-profile', profile_data: profile });
    if (userId) {
        await supabase.from('profiles').upsert({
            user_id: userId,
            name: profile.name || null,
            sex: profile.sex || null,
            age: profile.age || null,
            weight: profile.weight || null,
            height: profile.height || null,
            is_pro: profile.isPro ?? false,
        }, { onConflict: 'user_id' });
    }
}

// --- Sync & Migration ---

export async function syncLocalDataToCloud(userId: string): Promise<void> {
    const localItems = await db.wardrobe.toArray();
    const itemsToMigrate = localItems.filter(i => i.id.startsWith('local-'));
    const idMap = new Map<string, ClothingItem>();
    
    for (const item of itemsToMigrate) {
        const { id, ...rest } = item;
        let image = rest.image;
        
        if (image.startsWith('data:')) {
            try {
                image = await uploadImage(image, userId);
            } catch (err) {
                console.error('Failed to upload image during sync:', err);
                continue;
            }
        }

        const { data, error } = await supabase
            .from('wardrobe')
            .insert([{ ...rest, image, thumbnail: item.thumbnail, user_id: userId }])
            .select()
            .single();

        if (!error && data) {
            await db.wardrobe.delete(id);
            await db.wardrobe.put(data as ClothingItem);
            idMap.set(id, data as ClothingItem);
        }
    }

    const localPlan = await db.plans.get('weekly-plan');
    if (localPlan) {
        let planChanged = false;
        const newPlan = { ...localPlan.plan_data };
        
        for (const date in newPlan) {
            const outfit = newPlan[date];
            let outfitChanged = false;
            
            const nextItems = outfit.items.map(i => {
                const cloudItem = idMap.get(String(i.id));
                if (cloudItem) {
                    outfitChanged = true;
                    return cloudItem;
                }
                return i;
            });

            if (outfitChanged) {
                outfit.items = nextItems;
                planChanged = true;
            }
        }

        if (planChanged || itemsToMigrate.length > 0) {
            console.log('TRACE: Syncing merged weekly plan to cloud...');
            await saveWeeklyPlan(newPlan);
        }
    }

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
                const img = (item as { image: string }).image;
                if (img) await deleteImage(img);
            }
        }
        await supabase.from('wardrobe').delete().eq('user_id', userId);
        await supabase.from('plans').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('user_id', userId);
    }
    localStorage.clear();
}

export async function exportAllData(): Promise<string> {
    const data = {
        version: 4,
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
