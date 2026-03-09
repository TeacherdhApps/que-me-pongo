
import { useState, useCallback, useEffect } from 'react';
import { loadWardrobe, addClothingItem, updateClothingItem, deleteClothingItem, loadWeeklyPlan, saveWeeklyPlan } from '../lib/wardrobeStorage';
import type { ClothingItem, Category, WeeklyPlan, DailyOutfit } from '../types';
import { wardrobeEvents, authEvents } from '../lib/events';

export function useWardrobe() {
    const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(() => {
        loadWardrobe().then(data => {
            setWardrobe(data);
            setIsLoading(false);
        });
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
        const newItem = await addClothingItem(item);
        setWardrobe(prev => [newItem, ...prev]);
        wardrobeEvents.emit(); // Sync other hooks
        return newItem;
    }, []);

    const update = useCallback(async (id: string, updates: Partial<ClothingItem>) => {
        await updateClothingItem(id, updates);
        setWardrobe(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        wardrobeEvents.emit(); // Sync other hooks
    }, []);

    const remove = useCallback(async (id: string, imageUrl?: string) => {
        // Save current wardrobe for potential rollback
        const previousWardrobe = [...wardrobe];

        // Optimistic update: remove item from state immediately
        setWardrobe(prev => prev.filter(item => item.id !== id));
        wardrobeEvents.emit(); // Sync other hooks

        try {
            const success = await deleteClothingItem(id, imageUrl);
            if (!success) {
                // If the item wasn't found or couldn't be deleted, rollback
                console.warn('Deletion failed on server (item not found), rolling back state.');
                setWardrobe(previousWardrobe);
                wardrobeEvents.emit(); // Sync rollback
            }
        } catch (error) {
            // Error occurred during deletion, rollback
            console.error('Failed to delete item, rolling back state:', error);
            setWardrobe(previousWardrobe);
            wardrobeEvents.emit(); // Sync rollback
            // Re-throw so the UI can catch and show an alert if needed
            throw error;
        }
    }, [wardrobe]);

    const filterByCategory = useCallback((category: Category) => {
        return wardrobe.filter(item => item.category === category);
    }, [wardrobe]);

    return { wardrobe, isLoading, add, update, remove, filterByCategory };
}


export function useWeeklyPlan() {
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(() => {
        loadWeeklyPlan().then(data => {
            setPlan(data);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        refresh();
        return authEvents.subscribe(refresh);
    }, [refresh]);

    const updateDay = useCallback(async (day: string, outfit: DailyOutfit) => {
        setPlan(prev => {
            const next = { ...prev, [day]: outfit };
            saveWeeklyPlan(next);
            return next;
        });
    }, []);

    return { plan, isLoading, updateDay };
}
