import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';
import type { ClothingItem, DailyOutfit } from '../types';

vi.mock('../lib/wardrobeStorage');

const mockItem = {
    id: '1',
    name: 'Test Shirt',
    category: 'Superior',
    color: 'White',
    image: 'test.jpg',
    tags: []
};

describe('useWeeklyPlan outfit selection', () => {
    let currentPlan: Record<string, DailyOutfit> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        currentPlan = {};
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockImplementation(() => Promise.resolve(currentPlan));
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockImplementation((plan: DailyOutfit | any) => {
            currentPlan = plan;
            return Promise.resolve();
        });
    });

    it('should select an item and keep it selected', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });

        // Wait for initial load
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';
        
        // Select item
        await act(async () => {
            await result.current.updateDay(day, (prev) => {
                const currentItems = prev?.items || [];
                return { day: 'Martes', date: day, items: [...currentItems, mockItem as ClothingItem] };
            });
        });

        // Wait for the state to reflect the change
        await waitFor(() => {
            expect(result.current.plan[day]).toBeDefined();
            expect(result.current.plan[day]?.items).toHaveLength(1);
        });

        expect(result.current.plan[day]?.items[0].id).toBe('1');

        // Verify save was called with the correct data
        expect(wardrobeStorage.saveWeeklyPlan).toHaveBeenCalledWith({
            [day]: { day: 'Martes', date: day, items: [mockItem] }
        });
    });

    it('should toggle an item correctly (select then unselect)', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';
        
        // 1. Select item
        await act(async () => {
            await result.current.updateDay(day, () => {
                return { day: 'Martes', date: day, items: [mockItem as ClothingItem] };
            });
        });
        await waitFor(() => expect(result.current.plan[day]?.items).toHaveLength(1));

        // 2. Unselect item (toggle)
        await act(async () => {
            await result.current.updateDay(day, (prev) => {
                const items = prev.items.filter(i => i.id !== mockItem.id);
                return { ...prev, items };
            });
        });

        await waitFor(() => expect(result.current.plan[day]?.items).toHaveLength(0));
    });

    it('should maintain optimistic state even with slow network', async () => {
        let resolveSave: (value: void | PromiseLike<void>) => void;
        const savePromise = new Promise<void>((resolve) => {
            resolveSave = resolve;
        });

        // Mock save to be slow
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockReturnValue(savePromise);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';
        
        // Update day
        act(() => {
            result.current.updateDay(day, { day: 'Martes', date: day, items: [mockItem as ClothingItem] });
        });

        // Optimistic state should be set immediately (but might need a tick to propagate to hook return)
        await waitFor(() => {
            expect(result.current.plan[day]).toBeDefined();
            expect(result.current.plan[day]?.items).toHaveLength(1);
        });

        // Resolve the save
        await act(async () => {
            resolveSave!(undefined);
            await savePromise;
        });

        // State should still be there
        expect(result.current.plan[day]?.items).toHaveLength(1);
    });
});
