import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';
import type { DailyOutfit } from '../types';

vi.mock('../lib/wardrobeStorage');

describe('useWeeklyPlan persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load the weekly plan on mount', async () => {
        const mockPlan = {
            '2026-03-10': { day: 'Lunes', date: '2026-03-10', items: [] }
        };
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(mockPlan as any);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.plan).toEqual(mockPlan);
    });

    it('should call loadWeeklyPlan exactly once on mount', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});

        renderHook(() => useWeeklyPlan(), { wrapper });

        await waitFor(() => {
            expect(wardrobeStorage.loadWeeklyPlan).toHaveBeenCalledTimes(1);
        });
    });

    it('should call saveWeeklyPlan when updateDay is called', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newOutfit: DailyOutfit = {
            day: 'Martes',
            date: '2026-03-11',
            items: [{
                id: '1', name: 'Camisa', category: 'Prendas Superiores',
                color: 'blanco', image: 'camisa.jpg', tags: []
            }]
        };

        await act(async () => {
            await result.current.updateDay('2026-03-11', newOutfit);
        });

        expect(wardrobeStorage.saveWeeklyPlan).toHaveBeenCalled();

        // The saved plan should contain the new outfit merged into the existing plan
        const savedPlan = vi.mocked(wardrobeStorage.saveWeeklyPlan).mock.calls[0][0];
        expect(savedPlan['2026-03-11']).toEqual(newOutfit);
    });

    it('should reflect optimistic update in plan immediately', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newOutfit: DailyOutfit = {
            day: 'Miércoles',
            date: '2026-03-12',
            items: [{
                id: '2', name: 'Pantalón', category: 'Prendas Inferiores',
                color: 'negro', image: 'pant.jpg', tags: []
            }]
        };

        await act(async () => {
            await result.current.updateDay('2026-03-12', newOutfit);
        });

        // The plan should be updated optimistically
        await waitFor(() => {
            expect(result.current.plan['2026-03-12']?.day).toBe('Miércoles');
            expect(result.current.plan['2026-03-12']?.items).toHaveLength(1);
        });
    });

    it('should preserve existing days when adding a new day', async () => {
        const existingPlan = {
            '2026-03-10': {
                day: 'Lunes', date: '2026-03-10',
                items: [{ id: '1', name: 'Existing', category: 'Calzado', color: 'brown', image: 'e.jpg', tags: [] }]
            }
        };
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(existingPlan as any);
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Add a new day
        await act(async () => {
            await result.current.updateDay('2026-03-11', {
                day: 'Martes', date: '2026-03-11',
                items: [{ id: '2', name: 'New', category: 'Prendas Superiores', color: 'blue', image: 'n.jpg', tags: [] }]
            } as any);
        });

        // Both days should exist
        await waitFor(() => {
            expect(result.current.plan['2026-03-10']?.items).toHaveLength(1);
            expect(result.current.plan['2026-03-11']?.items).toHaveLength(1);
        });
    });

    it('should support functional updates', async () => {
        const existingPlan = {
            '2026-03-10': {
                day: 'Lunes', date: '2026-03-10',
                items: [{ id: '1', name: 'Existing', category: 'Calzado', color: 'brown', image: 'e.jpg', tags: [] }]
            }
        };
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(existingPlan as any);
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Use functional update to add an item to an existing day
        await act(async () => {
            await result.current.updateDay('2026-03-10', (prev) => ({
                ...prev,
                items: [...prev.items, { id: '2', name: 'Added', category: 'Prendas Superiores', color: 'white', image: 'a.jpg', tags: [] }]
            }));
        });

        await waitFor(() => {
            expect(result.current.plan['2026-03-10']?.items).toHaveLength(2);
        });
    });
});
