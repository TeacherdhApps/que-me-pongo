
import { supabase } from './supabase';
import type { ClothingItem, WeeklyPlan, UserProfile } from '../types';

const WARDROBE_KEY = 'que-me-pongo:wardrobe';
const WEEKLY_PLAN_KEY = 'que-me-pongo:weekly-plan';
const USER_PROFILE_KEY = 'que-me-pongo:user-profile';

// --- Helpers ---

async function getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
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

export async function deleteClothingItem(id: string): Promise<void> {
    const userId = await getUserId();

    if (userId && !id.startsWith('local-')) {
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
    // Note: Profile can later be moved to a 'profiles' table in Supabase
    try {
        const raw = localStorage.getItem(USER_PROFILE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
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
            // Clear existing and insert new (or just upsert)
            // For simplicity, we'll just insert everything with the new user_id
            const wardrobeToImport = data.wardrobe.map((item: any) => {
                const { id, ...rest } = item;
                return { ...rest, user_id: userId };
            });
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
