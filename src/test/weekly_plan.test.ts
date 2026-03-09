import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import * as wardrobeStorage from '../lib/wardrobeStorage';

vi.mock('../lib/wardrobeStorage');

describe('useWeeklyPlan persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load the weekly plan on mount', async () => {
        const mockPlan = { Lunes: { day: 'Lunes', items: [] } };
        (wardrobeStorage.loadWeeklyPlan as any).mockResolvedValue(mockPlan);

        const { result } = renderHook(() => useWeeklyPlan());

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.plan).toEqual(mockPlan);
    });

    it('should call saveWeeklyPlan when updateDay is called', async () => {
        (wardrobeStorage.loadWeeklyPlan as any).mockResolvedValue({});
        (wardrobeStorage.saveWeeklyPlan as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newOutfit = { day: 'Martes', items: [{ id: '1', name: 'Item 1', category: 'Superior', color: 'red', image: '', tags: [] }] };
        
        await act(async () => {
            await result.current.updateDay('Martes', newOutfit as any);
        });

        expect(result.current.plan['Martes']).toEqual(newOutfit);
        expect(wardrobeStorage.saveWeeklyPlan).toHaveBeenCalledWith({ Martes: newOutfit });
    });
});
