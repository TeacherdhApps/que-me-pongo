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
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const updateDayMutation = useMutation({
        mutationKey: ['update-weekly-plan'],
        mutationFn: async ({ nextPlan }: { day: string; nextPlan: Record<string, DailyOutfit> }) => {
            return saveWeeklyPlan(nextPlan);
        },
        onMutate: async ({ nextPlan }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['weekly-plan'] });

            // Snapshot the previous value
            const previousPlan = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']);

            // Optimistically update to the new value
            queryClient.setQueryData(['weekly-plan'], nextPlan);

            // Return a context object with the snapshotted value
            return { previousPlan };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPlan) {
                queryClient.setQueryData(['weekly-plan'], context.previousPlan);
            }
        },
        onSettled: () => {
            // Only invalidate if there are no more mutations in flight
            if (queryClient.isMutating({ mutationKey: ['update-weekly-plan'] }) <= 1) {
                queryClient.invalidateQueries({ queryKey: ['weekly-plan'] });
            }
        },
    });

    const updateDay = useCallback(async (day: string, update: DailyOutfit | ((old: DailyOutfit) => DailyOutfit)) => {
        // Get the most current data from cache to avoid race conditions with multiple clicks
        const currentPlan = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']) || plan;
        const oldOutfit = currentPlan[day] || { day: day, items: [], date: day };
        const nextOutfit = typeof update === 'function' ? update(oldOutfit) : update;
        const nextPlan = { ...currentPlan, [day]: nextOutfit };
        
        return updateDayMutation.mutateAsync({ day, nextPlan });
    }, [queryClient, plan, updateDayMutation.mutateAsync]);

    return { 
        plan, 
        isLoading, 
        updateDay 
    };
}
