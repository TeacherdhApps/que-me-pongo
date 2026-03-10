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

export function useWeeklyPlan() {
    const queryClient = useQueryClient();

    const { data: plan = {}, isLoading } = useQuery({
        queryKey: ['weekly-plan'],
        queryFn: loadWeeklyPlan,
    });

    const updateDayMutation = useMutation({
        mutationFn: async (args: { day: string; update: DailyOutfit | ((old: DailyOutfit) => DailyOutfit) }) => {
            const currentPlan = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']) || {};
            const oldOutfit = currentPlan[args.day] || { day: args.day, items: [], date: args.day };
            const nextOutfit = typeof args.update === 'function' ? args.update(oldOutfit) : args.update;
            
            const nextPlan = { ...currentPlan, [args.day]: nextOutfit };
            return saveWeeklyPlan(nextPlan);
        },
        onMutate: async ({ day, update }) => {
            await queryClient.cancelQueries({ queryKey: ['weekly-plan'] });
            const previousPlan = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']);
            
            queryClient.setQueryData(['weekly-plan'], (old: Record<string, DailyOutfit> = {}) => {
                const oldOutfit = old[day] || { day: day, items: [], date: day };
                const nextOutfit = typeof update === 'function' ? update(oldOutfit) : update;
                return {
                    ...old,
                    [day]: nextOutfit
                };
            });

            return { previousPlan };
        },
        onError: (_err, _args, context) => {
            if (context?.previousPlan) {
                queryClient.setQueryData(['weekly-plan'], context.previousPlan);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly-plan'] });
        },
    });

    return { 
        plan, 
        isLoading, 
        updateDay: (day: string, update: DailyOutfit | ((old: DailyOutfit) => DailyOutfit)) => 
            updateDayMutation.mutateAsync({ day, update }) 
    };
}
