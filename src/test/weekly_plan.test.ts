import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';

vi.mock('../lib/wardrobeStorage');

describe('useWeeklyPlan persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load the weekly plan on mount', async () => {
        const mockPlan = { Lunes: { day: 'Lunes', items: [] } };
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(mockPlan as any);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.plan).toEqual(mockPlan);
    });

    it('should call saveWeeklyPlan when updateDay is called', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeeklyPlan(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newOutfit = { day: 'Martes', items: [{ id: '1', name: 'Item 1', category: 'Prendas Superiores', color: 'red', image: '', tags: [] }] };
        
        await act(async () => {
            await result.current.updateDay('Martes', newOutfit as any);
        });

        expect(wardrobeStorage.saveWeeklyPlan).toHaveBeenCalled();
    });
});
