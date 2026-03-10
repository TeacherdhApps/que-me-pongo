import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';

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
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should select an item and keep it selected', async () => {
        (wardrobeStorage.loadWeeklyPlan as any).mockResolvedValue({});
        (wardrobeStorage.saveWeeklyPlan as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });

        // Wait for initial load
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';
        
        // Select item
        await act(async () => {
            await result.current.updateDay(day, (prev) => {
                const currentItems = prev?.items || [];
                return { day: 'Martes', date: day, items: [...currentItems, mockItem as any] };
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
        (wardrobeStorage.loadWeeklyPlan as any).mockResolvedValue({});
        (wardrobeStorage.saveWeeklyPlan as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';
        
        // 1. Select item
        await act(async () => {
            await result.current.updateDay(day, (prev) => {
                return { day: 'Martes', date: day, items: [mockItem as any] };
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
});
