import { useState, useCallback, useEffect } from 'react';
import { loadWardrobe, addClothingItem, updateClothingItem, deleteClothingItem, loadWeeklyPlan, saveWeeklyPlan } from '../lib/wardrobeStorage';
import type { ClothingItem, Category, WeeklyPlan, DailyOutfit } from '../types';
import { wardrobeEvents, authEvents } from '../lib/events';

export function useWardrobe() {
    const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const data = await loadWardrobe();
            setWardrobe(data);
        } catch (err) {
            console.error('Refresh wardrobe error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const unsubWardrobe = wardrobeEvents.subscribe(refresh);
        const unsubAuth = authEvents.subscribe(refresh);
        return () => {
            unsubWardrobe();
            unsubAuth();
        };
    }, [refresh]);

    const add = useCallback(async (item: Omit<ClothingItem, 'id'>) => {
        try {
            const newItem = await addClothingItem(item);
            // After successful cloud/local add, we just emit to all hooks to refresh from DB
            // This ensures every instance of useWardrobe has the exact same state as the DB
            wardrobeEvents.emit();
            return newItem;
        } catch (error) {
            console.error('Failed to add item:', error);
            throw error;
        }
    }, []);

    const update = useCallback(async (id: string, updates: Partial<ClothingItem>) => {
        try {
            await updateClothingItem(id, updates);
            wardrobeEvents.emit();
        } catch (error) {
            console.error('Failed to update item:', error);
            throw error;
        }
    }, []);

    const remove = useCallback(async (id: string, imageUrl?: string) => {
        // Optimistic update: remove item from local state immediately
        const previousWardrobe = [...wardrobe];
        setWardrobe(prev => prev.filter(item => item.id !== id));

        try {
            await deleteClothingItem(id, imageUrl);
            wardrobeEvents.emit(); // Sync everyone else
        } catch (error) {
            console.error('Failed to delete item, rolling back state:', error);
            setWardrobe(previousWardrobe);
            throw error;
        }
    }, [wardrobe]);

    const filterByCategory = useCallback((category: Category) => {
        return wardrobe.filter(item => item.category === category);
    }, [wardrobe]);

    return { wardrobe, isLoading, add, update, remove, filterByCategory, refresh };
}


export function useWeeklyPlan() {
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const data = await loadWeeklyPlan();
            setPlan(data);
        } catch (err) {
            console.error('Refresh plan error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const unsub = authEvents.subscribe(refresh);
        return () => unsub();
    }, [refresh]);

    const updateDay = useCallback(async (day: string, outfit: DailyOutfit) => {
        try {
            // Update state immediately for UX
            setPlan(prev => ({ ...prev, [day]: outfit }));
            // Persist
            await saveWeeklyPlan({ ...plan, [day]: outfit });
        } catch (error) {
            console.error('Failed to save plan:', error);
        }
    }, [plan]);

    return { plan, isLoading, updateDay, refresh };
}
