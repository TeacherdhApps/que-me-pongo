
import { useState, useCallback, useEffect } from 'react';
import { loadWardrobe, addClothingItem, updateClothingItem, deleteClothingItem, loadWeeklyPlan, saveWeeklyPlan } from '../lib/wardrobeStorage';
import type { ClothingItem, Category, WeeklyPlan, DailyOutfit } from '../types';

export function useWardrobe() {
    const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadWardrobe().then(data => {
            setWardrobe(data);
            setIsLoading(false);
        });
    }, []);

    const add = useCallback(async (item: Omit<ClothingItem, 'id'>) => {
        const newItem = await addClothingItem(item);
        setWardrobe(prev => [newItem, ...prev]);
        return newItem;
    }, []);

    const update = useCallback(async (id: string, updates: Partial<ClothingItem>) => {
        await updateClothingItem(id, updates);
        setWardrobe(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, []);

    const remove = useCallback(async (id: string, imageUrl?: string) => {
        await deleteClothingItem(id, imageUrl);
        setWardrobe(prev => prev.filter(item => item.id !== id));
    }, []);

    const filterByCategory = useCallback((category: Category) => {
        return wardrobe.filter(item => item.category === category);
    }, [wardrobe]);

    return { wardrobe, isLoading, add, update, remove, filterByCategory };
}


export function useWeeklyPlan() {
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadWeeklyPlan().then(data => {
            setPlan(data);
            setIsLoading(false);
        });
    }, []);

    const updateDay = useCallback(async (day: string, outfit: DailyOutfit) => {
        setPlan(prev => ({ ...prev, [day]: outfit }));
        await saveWeeklyPlan({ ...plan, [day]: outfit });
    }, [plan]);

    return { plan, isLoading, updateDay };
}
