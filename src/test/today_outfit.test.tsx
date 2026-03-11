
import { render, screen, waitFor } from '@testing-library/react';
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
        (wardrobeStorage.loadWeeklyPlan as any).mockResolvedValue({});
        
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
                    { id: '1', name: 'Camisa', image: 'camisa.jpg', category: 'Superior' }
                ]
            }
        };

        (wardrobeStorage.loadWeeklyPlan as any).mockResolvedValue(mockPlan);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('EDITAR')).toBeInTheDocument();
        });
        expect(screen.getByRole('img')).toHaveAttribute('src', 'camisa.jpg');
    });
});
