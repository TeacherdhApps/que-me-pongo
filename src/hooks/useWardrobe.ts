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
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: ['wardrobe'] });
            const previousWardrobe = queryClient.getQueryData<ClothingItem[]>(['wardrobe']);
            
            // Optimistically add the new item with a temp ID
            queryClient.setQueryData(['wardrobe'], (old: ClothingItem[] = []) => [
                { ...newItem, id: `temp-${Date.now()}` },
                ...old
            ]);

            return { previousWardrobe };
        },
        onError: (_err, _newItem, context) => {
            if (context?.previousWardrobe) {
                queryClient.setQueryData(['wardrobe'], context.previousWardrobe);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (args: { id: string; updates: Partial<ClothingItem> }) => 
            updateClothingItem(args.id, args.updates),
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['wardrobe'] });
            const previousWardrobe = queryClient.getQueryData<ClothingItem[]>(['wardrobe']);
            
            queryClient.setQueryData(['wardrobe'], (old: ClothingItem[] = []) => 
                old.map(item => item.id === id ? { ...item, ...updates } : item)
            );

            return { previousWardrobe };
        },
        onError: (_err, _args, context) => {
            if (context?.previousWardrobe) {
                queryClient.setQueryData(['wardrobe'], context.previousWardrobe);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (args: { id: string; imageUrl?: string }) => 
            deleteClothingItem(args.id, args.imageUrl),
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ['wardrobe'] });
            const previousWardrobe = queryClient.getQueryData<ClothingItem[]>(['wardrobe']);
            
            // Optimistically remove
            queryClient.setQueryData(['wardrobe'], (old: ClothingItem[] = []) => 
                old.filter(item => item.id !== id)
            );

            return { previousWardrobe };
        },
        onError: (_err, _args, context) => {
            if (context?.previousWardrobe) {
                queryClient.setQueryData(['wardrobe'], context.previousWardrobe);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (items: { id: string; imageUrl?: string }[]) => {
            await Promise.all(items.map(item => deleteClothingItem(item.id, item.imageUrl)));
        },
        onMutate: async (items) => {
            await queryClient.cancelQueries({ queryKey: ['wardrobe'] });
            const previousWardrobe = queryClient.getQueryData<ClothingItem[]>(['wardrobe']);
            const idsToRemove = items.map(i => i.id);
            
            queryClient.setQueryData(['wardrobe'], (old: ClothingItem[] = []) => 
                old.filter(item => !idsToRemove.includes(item.id))
            );

            return { previousWardrobe };
        },
        onError: (_err, _args, context) => {
            if (context?.previousWardrobe) {
                queryClient.setQueryData(['wardrobe'], context.previousWardrobe);
            }
        },
        onSettled: () => {
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
        bulkRemove: bulkDeleteMutation.mutateAsync,
        filterByCategory 
    };
}

import { useState, useEffect } from 'react';

export function useWeeklyPlan() {
    const queryClient = useQueryClient();

    const { data: planData = {}, isLoading } = useQuery({
        queryKey: ['weekly-plan'],
        queryFn: loadWeeklyPlan,
    });

    const [plan, setPlan] = useState<Record<string, DailyOutfit>>(planData);

    useEffect(() => {
        if (planData) {
            setPlan(planData);
        }
    }, [planData]);

    const updateDayMutation = useMutation({
        mutationFn: async (nextPlan: Record<string, DailyOutfit>) => {
            return saveWeeklyPlan(nextPlan);
        },
        onError: (_err, _nextPlan, context: any) => {
            if (context?.previousPlan) {
                setPlan(context.previousPlan);
            }
        },
    });

    return { 
        plan, 
        isLoading, 
        updateDay: async (day: string, update: DailyOutfit | ((old: DailyOutfit) => DailyOutfit)) => {
            const oldOutfit = plan[day] || { day: day, items: [], date: day };
            const nextOutfit = typeof update === 'function' ? update(oldOutfit) : update;
            const nextPlan = { ...plan, [day]: nextOutfit };
            
            const previousPlan = plan;
            setPlan(nextPlan);
            
            try {
                await updateDayMutation.mutateAsync(nextPlan);
            } catch (err) {
                setPlan(previousPlan);
                throw err;
            }
        }
    };
}
