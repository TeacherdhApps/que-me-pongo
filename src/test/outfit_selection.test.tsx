import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';
import type { ClothingItem, DailyOutfit } from '../types';

vi.mock('../lib/wardrobeStorage');
vi.mock('../lib/imageResizer', () => ({
    resizeImage: vi.fn((base64: string) => Promise.resolve(base64)),
    generateThumbnail: vi.fn((base64: string) => Promise.resolve(base64)),
}));

const mockShirt: ClothingItem = {
    id: '1',
    name: 'Camisa Oxford',
    category: 'Prendas Superiores',
    color: 'Blanco',
    image: 'shirt.jpg',
    tags: ['formal']
};

const mockPants: ClothingItem = {
    id: '2',
    name: 'Pantalón Chino',
    category: 'Prendas Inferiores',
    color: 'Negro',
    image: 'pants.jpg',
    tags: ['casual']
};

const mockJacket: ClothingItem = {
    id: '3',
    name: 'Chamarra de Cuero',
    category: 'Prendas de Abrigo',
    color: 'Negro',
    image: 'jacket.jpg',
    tags: ['casual']
};

describe('useWeeklyPlan outfit selection', () => {
    let currentPlan: Record<string, DailyOutfit> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        currentPlan = {};
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockImplementation(() => Promise.resolve(currentPlan));
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockImplementation((plan: Record<string, DailyOutfit>) => {
            currentPlan = plan;
            return Promise.resolve();
        });
    });

    it('should load an empty plan on mount', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.plan).toEqual({});
    });

    it('should load a pre-existing plan on mount', async () => {
        const existingPlan = {
            '2026-03-10': { day: 'Martes', date: '2026-03-10', items: [mockShirt] }
        };
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(existingPlan);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.plan['2026-03-10']?.items).toHaveLength(1);
        expect(result.current.plan['2026-03-10']?.items[0].name).toBe('Camisa Oxford');
    });

    it('should select an item and persist it', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';

        await act(async () => {
            await result.current.updateDay(day, {
                day: 'Martes',
                date: day,
                items: [mockShirt]
            });
        });

        // Optimistic update should be visible immediately
        await waitFor(() => {
            expect(result.current.plan[day]).toBeDefined();
            expect(result.current.plan[day]?.items).toHaveLength(1);
        });

        expect(result.current.plan[day]?.items[0].id).toBe('1');

        // Verify persistence was called with correct structure
        expect(wardrobeStorage.saveWeeklyPlan).toHaveBeenCalledWith(
            expect.objectContaining({
                [day]: expect.objectContaining({
                    day: 'Martes',
                    date: day,
                    items: expect.arrayContaining([
                        expect.objectContaining({ id: '1', name: 'Camisa Oxford' })
                    ])
                })
            })
        );
    });

    it('should add multiple items to the same day', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';

        // Add first item
        await act(async () => {
            await result.current.updateDay(day, {
                day: 'Martes', date: day, items: [mockShirt]
            });
        });

        // Add second item using functional update
        await act(async () => {
            await result.current.updateDay(day, (prev) => ({
                ...prev,
                items: [...prev.items, mockPants]
            }));
        });

        await waitFor(() => {
            expect(result.current.plan[day]?.items).toHaveLength(2);
        });

        expect(result.current.plan[day]?.items.map(i => i.name)).toEqual([
            'Camisa Oxford',
            'Pantalón Chino'
        ]);
    });

    it('should toggle an item off (unselect)', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';

        // 1. Select item
        await act(async () => {
            await result.current.updateDay(day, {
                day: 'Martes', date: day, items: [mockShirt]
            });
        });
        await waitFor(() => expect(result.current.plan[day]?.items).toHaveLength(1));

        // 2. Unselect item (toggle off)
        await act(async () => {
            await result.current.updateDay(day, (prev) => ({
                ...prev,
                items: prev.items.filter(i => i.id !== mockShirt.id)
            }));
        });

        await waitFor(() => expect(result.current.plan[day]?.items).toHaveLength(0));
    });

    it('should replace an entire outfit for a day', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';

        // Set initial outfit
        await act(async () => {
            await result.current.updateDay(day, {
                day: 'Martes', date: day, items: [mockShirt, mockPants]
            });
        });

        // Replace with new outfit
        await act(async () => {
            await result.current.updateDay(day, {
                day: 'Martes', date: day, items: [mockJacket]
            });
        });

        await waitFor(() => {
            expect(result.current.plan[day]?.items).toHaveLength(1);
            expect(result.current.plan[day]?.items[0].name).toBe('Chamarra de Cuero');
        });
    });

    it('should clear all items from a day', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';

        // Add outfit
        await act(async () => {
            await result.current.updateDay(day, {
                day: 'Martes', date: day, items: [mockShirt, mockPants]
            });
        });

        // Clear
        await act(async () => {
            await result.current.updateDay(day, (prev) => ({
                ...prev,
                items: []
            }));
        });

        await waitFor(() => expect(result.current.plan[day]?.items).toHaveLength(0));
    });

    it('should handle plans for multiple days independently', async () => {
        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Set Monday
        await act(async () => {
            await result.current.updateDay('2026-03-10', {
                day: 'Lunes', date: '2026-03-10', items: [mockShirt]
            });
        });

        // Set Tuesday
        await act(async () => {
            await result.current.updateDay('2026-03-11', {
                day: 'Martes', date: '2026-03-11', items: [mockJacket, mockPants]
            });
        });

        await waitFor(() => {
            expect(result.current.plan['2026-03-10']?.items).toHaveLength(1);
            expect(result.current.plan['2026-03-11']?.items).toHaveLength(2);
        });

        // Updating one day should not affect the other
        expect(result.current.plan['2026-03-10']?.items[0].name).toBe('Camisa Oxford');
        expect(result.current.plan['2026-03-11']?.items.map(i => i.name)).toEqual([
            'Chamarra de Cuero',
            'Pantalón Chino'
        ]);
    });

    it('should maintain optimistic state even with slow network', async () => {
        let resolveSave!: () => void;
        const slowSavePromise = new Promise<void>((resolve) => {
            resolveSave = resolve;
        });

        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockReturnValue(slowSavePromise);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const day = '2026-03-10';

        // Start the update (it will hang because save is slow)
        act(() => {
            result.current.updateDay(day, {
                day: 'Martes', date: day, items: [mockShirt]
            });
        });

        // Optimistic update should be visible immediately, even before save completes
        await waitFor(() => {
            expect(result.current.plan[day]).toBeDefined();
            expect(result.current.plan[day]?.items).toHaveLength(1);
        });

        // Finish the save
        await act(async () => {
            resolveSave();
            await slowSavePromise;
        });

        // State should still be intact
        expect(result.current.plan[day]?.items).toHaveLength(1);
    });

    it('should call saveWeeklyPlan with the full plan including the new day', async () => {
        // Pre-existing plan for Monday
        const existingPlan: Record<string, DailyOutfit> = {
            '2026-03-10': { day: 'Lunes', date: '2026-03-10', items: [mockShirt] }
        };
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockImplementation(() => Promise.resolve(existingPlan));
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockImplementation((plan) => {
            // Verify the full plan is saved, not just the updated day
            Object.assign(existingPlan, plan);
            return Promise.resolve();
        });

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Add Tuesday
        await act(async () => {
            await result.current.updateDay('2026-03-11', {
                day: 'Martes', date: '2026-03-11', items: [mockPants]
            });
        });

        // saveWeeklyPlan should have been called with BOTH days
        await waitFor(() => {
            expect(wardrobeStorage.saveWeeklyPlan).toHaveBeenCalled();
            const savedPlan = vi.mocked(wardrobeStorage.saveWeeklyPlan).mock.calls[0][0];
            expect(savedPlan['2026-03-10']).toBeDefined();
            expect(savedPlan['2026-03-11']).toBeDefined();
            expect(savedPlan['2026-03-11'].items[0].name).toBe('Pantalón Chino');
        });
    });
});
