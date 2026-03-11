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

class SerialQueue {
    private promise: Promise<void> = Promise.resolve();

    enqueue<T>(fn: () => Promise<T>): Promise<T> {
        const next = this.promise.then(() => fn());
        this.promise = next.then(() => {});
        return next;
    }
}

const planQueue = new SerialQueue();

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
        mutationFn: async ({ day, nextOutfit }: { day: string; nextOutfit: DailyOutfit }) => {
            // By the time this runs, the cache might have been updated multiple times optimistically.
            // We want to save the ABSOLUTE LATEST state of the whole plan.
            const latestPlan = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']) || {};
            const fullPlan = { ...latestPlan, [day]: nextOutfit };
            return saveWeeklyPlan(fullPlan);
        },
        onMutate: async ({ day, nextOutfit }) => {
            await queryClient.cancelQueries({ queryKey: ['weekly-plan'] });
            const previousPlan = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']);

            // OPTIMISTIC UPDATE: Use functional update to ensure we never base our change on stale cache.
            queryClient.setQueryData(['weekly-plan'], (old: Record<string, DailyOutfit> = {}) => ({
                ...old,
                [day]: nextOutfit
            }));

            return { previousPlan };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPlan) {
                queryClient.setQueryData(['weekly-plan'], context.previousPlan);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly-plan'] });
        },
    });

    const updateDay = useCallback(async (day: string, update: DailyOutfit | ((old: DailyOutfit) => DailyOutfit)) => {
        return planQueue.enqueue(async () => {
            // Get the absolute latest data from the cache right now
            const currentCache = queryClient.getQueryData<Record<string, DailyOutfit>>(['weekly-plan']) || {};
            const oldOutfit = currentCache[day] || { day: day, items: [], date: day };
            const nextOutfit = typeof update === 'function' ? update(oldOutfit) : update;
            
            return updateDayMutation.mutateAsync({ day, nextOutfit });
        });
    }, [queryClient, updateDayMutation.mutateAsync]);

    return { 
        plan, 
        isLoading, 
        updateDay 
    };
}
