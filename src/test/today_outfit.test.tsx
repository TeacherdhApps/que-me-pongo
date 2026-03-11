
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TodayOutfitWidget } from '../components/TodayOutfitWidget';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';

vi.mock('../hooks/useWeather', () => ({
    useWeather: () => ({ weather: { temp: 25, condition: 'Soleado' } })
}));

vi.mock('../hooks/useOutfitRecommendation', () => ({
    useOutfitRecommendation: () => ({
        recommendation: null,
        loading: false,
        error: null,
        generateRecommendation: vi.fn()
    })
}));

describe('TodayOutfitWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display "CREAR OUTFIT" when today is empty', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        
        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument();
        });
        expect(screen.getByText('Tu Outfit')).toBeInTheDocument();
        expect(screen.getByText(/25°C/)).toBeInTheDocument();
    });

    it('should display items and "EDITAR" when today has items', async () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        const mockPlan = {
            [dateKey]: {
                day: 'Hoy',
                date: dateKey,
                items: [
                    { id: '1', name: 'Camisa', image: 'camisa.jpg', category: 'Superior', color: 'white', tags: [] }
                ]
            }
        };

        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(mockPlan as any);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('EDITAR')).toBeInTheDocument();
        });
        expect(screen.getByRole('img')).toHaveAttribute('src', 'camisa.jpg');
    });

    it('should handle multiple rapid updates without losing state', async () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        
        const { } = render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument());

        // Open editor
        screen.getByText('CREAR OUTFIT').click();

        // In OutfitEditor (we need to make sure we can find things)
        // Since OutfitEditor is a modal that renders in full screen, it should be in the DOM
        
        // Use a module-level variable from setup.ts (we need to be able to access it)
        // Actually, we can just use the vi.mocked helper if we want to change implementation
        vi.mocked(wardrobeStorage.loadWardrobe).mockResolvedValue([
            { id: '1', name: 'Item 1', image: '1.jpg', category: 'Superior', color: 'red', tags: [] },
            { id: '2', name: 'Item 2', image: '2.jpg', category: 'Superior', color: 'blue', tags: [] }
        ]);

        // We might need to wait for wardrobe to load in the editor
        await waitFor(() => expect(screen.getByText('Superior')).toBeInTheDocument());
        
        // Open the Superior section
        fireEvent.click(screen.getByText('Superior'));

        await waitFor(() => expect(screen.getByAltText('Item 1')).toBeInTheDocument());

        // Click Item 1 then Item 2 rapidly
        const item1 = screen.getByAltText('Item 1');
        const item2 = screen.getByAltText('Item 2');

        fireEvent.click(item1);
        fireEvent.click(item2);

        // Check if both items are in the save call
        await waitFor(() => {
            const calls = vi.mocked(wardrobeStorage.saveWeeklyPlan).mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            const lastCall = calls[calls.length - 1][0];
            expect(lastCall[dateKey].items).toHaveLength(2);
        }, { timeout: 2000 });
    });
});
