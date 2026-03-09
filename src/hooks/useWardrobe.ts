
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { 
    loadWardrobe, 
    addClothingItem, 
    updateClothingItem, 
    deleteClothingItem, 
    loadWeeklyPlan, 
    saveWeeklyPlan 
} from '../lib/wardrobeStorage';
import type { ClothingItem, Category, DailyOutfit } from '../types';

export function useWardrobe() {
    const queryClient = useQueryClient();

    const { data: wardrobe = [], isLoading } = useQuery({
        queryKey: ['wardrobe'],
        queryFn: loadWardrobe,
    });

    const addMutation = useMutation({
        mutationFn: addClothingItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (args: { id: string; updates: Partial<ClothingItem> }) => 
            updateClothingItem(args.id, args.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (args: { id: string; imageUrl?: string }) => 
            deleteClothingItem(args.id, args.imageUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
    });

    const filterByCategory = useCallback((category: Category) => {
        return wardrobe.filter(item => item.category === category);
    }, [wardrobe]);

    return { 
        wardrobe, 
        isLoading, 
        add: addMutation.mutateAsync, 
        update: updateMutation.mutateAsync, 
        remove: deleteMutation.mutateAsync, 
        filterByCategory 
    };
}

export function useWeeklyPlan() {
    const queryClient = useQueryClient();

    const { data: plan = {}, isLoading } = useQuery({
        queryKey: ['weekly-plan'],
        queryFn: loadWeeklyPlan,
    });

    const updateDayMutation = useMutation({
        mutationFn: (args: { day: string; outfit: DailyOutfit }) => {
            const nextPlan = { ...plan, [args.day]: args.outfit };
            return saveWeeklyPlan(nextPlan);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly-plan'] });
        },
    });

    return { 
        plan, 
        isLoading, 
        updateDay: (day: string, outfit: DailyOutfit) => updateDayMutation.mutateAsync({ day, outfit }) 
    };
}
