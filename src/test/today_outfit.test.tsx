import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TodayOutfitWidget } from '../components/TodayOutfitWidget';
import * as wardrobeStorage from '../lib/wardrobeStorage';
import { wrapper } from './setup';

vi.mock('../hooks/useWeather', () => ({
    useWeather: () => ({ weather: { temp: 25, condition: 'Soleado' } })
}));


function getTodayDateKey(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

describe('TodayOutfitWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display "CREAR OUTFIT" when today has no plan', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument();
        });
        expect(screen.getByText('Tu Outfit')).toBeInTheDocument();
        expect(screen.getByText(/25°C/)).toBeInTheDocument();
    });

    it('should show weather information in the widget', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText(/25°C/)).toBeInTheDocument();
            expect(screen.getByText(/Soleado/)).toBeInTheDocument();
        });
    });

    it('should display "EDITAR" and "VER" buttons when today has items', async () => {
        const dateKey = getTodayDateKey();

        const mockPlan = {
            [dateKey]: {
                day: 'Hoy',
                date: dateKey,
                items: [
                    { id: '1', name: 'Camisa', image: 'camisa.jpg', category: 'Prendas Superiores', color: 'white', tags: [] }
                ]
            }
        };

        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(mockPlan as any);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('EDITAR')).toBeInTheDocument();
        });
        expect(screen.getByText('VER')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'camisa.jpg');
    });

    it('should show item thumbnails (up to 4) when items exist', async () => {
        const dateKey = getTodayDateKey();

        const mockPlan = {
            [dateKey]: {
                day: 'Hoy',
                date: dateKey,
                items: [
                    { id: '1', name: 'Prenda 1', image: 'img1.jpg', category: 'Prendas de Abrigo', color: 'red', tags: [] },
                    { id: '2', name: 'Prenda 2', image: 'img2.jpg', category: 'Prendas Superiores', color: 'blue', tags: [] },
                    { id: '3', name: 'Prenda 3', image: 'img3.jpg', category: 'Prendas Inferiores', color: 'black', tags: [] },
                    { id: '4', name: 'Prenda 4', image: 'img4.jpg', category: 'Calzado', color: 'brown', tags: [] },
                ]
            }
        };

        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(mockPlan as any);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images).toHaveLength(4);
        });
    });

    it('should show "+N" badge when more than 4 items', async () => {
        const dateKey = getTodayDateKey();

        const mockPlan = {
            [dateKey]: {
                day: 'Hoy',
                date: dateKey,
                items: Array.from({ length: 6 }, (_, i) => ({
                    id: String(i + 1),
                    name: `Prenda ${i + 1}`,
                    image: `img${i + 1}.jpg`,
                    category: 'Prendas Superiores',
                    color: 'blue',
                    tags: []
                }))
            }
        };

        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue(mockPlan as any);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('+2')).toBeInTheDocument();
        });
    });

    it('should open the OutfitEditor when "CREAR OUTFIT" is clicked', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument());

        fireEvent.click(screen.getByText('CREAR OUTFIT'));

        // OutfitEditor renders a full-screen overlay with "Listo" button
        await waitFor(() => {
            expect(screen.getByText('Listo')).toBeInTheDocument();
        });
    });

    it('should open the OutfitEditor and show wardrobe sections', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        vi.mocked(wardrobeStorage.loadWardrobe).mockResolvedValue([
            { id: '1', name: 'Chamarra', image: '1.jpg', category: 'Prendas de Abrigo', color: 'brown', tags: [] },
            { id: '2', name: 'Camiseta', image: '2.jpg', category: 'Prendas Superiores', color: 'blue', tags: [] }
        ]);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument());
        fireEvent.click(screen.getByText('CREAR OUTFIT'));

        // Should show the category sections
        await waitFor(() => {
            expect(screen.getByText('Prendas de Abrigo')).toBeInTheDocument();
            expect(screen.getByText('Prendas Superiores')).toBeInTheDocument();
        });
    });

    it('should toggle items in the editor and show check marks', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        vi.mocked(wardrobeStorage.loadWardrobe).mockResolvedValue([
            { id: '1', name: 'Item 1', image: '1.jpg', category: 'Prendas Superiores', color: 'red', tags: [] },
            { id: '2', name: 'Item 2', image: '2.jpg', category: 'Prendas Superiores', color: 'blue', tags: [] }
        ]);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument());
        fireEvent.click(screen.getByText('CREAR OUTFIT'));

        // Open the section
        await waitFor(() => expect(screen.getByText('Prendas Superiores')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Prendas Superiores'));

        // Wait for items to appear
        await waitFor(() => expect(screen.getByAltText('Item 1')).toBeInTheDocument());

        // Select Item 1 — the button should gain the "ring-4 ring-black" class
        const item1Button = screen.getByAltText('Item 1').closest('button')!;
        expect(item1Button.className).toContain('opacity-60'); // not selected

        fireEvent.click(item1Button);

        // After clicking, it should be selected (ring-4 ring-black)
        await waitFor(() => {
            expect(item1Button.className).toContain('ring-4');
            expect(item1Button.className).toContain('ring-black');
        });
    });

    it('should save selection only when "Listo" is clicked, not on every toggle', async () => {
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({});
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);
        vi.mocked(wardrobeStorage.loadWardrobe).mockResolvedValue([
            { id: '1', name: 'Item 1', image: '1.jpg', category: 'Prendas Superiores', color: 'red', tags: [] },
            { id: '2', name: 'Item 2', image: '2.jpg', category: 'Prendas Superiores', color: 'blue', tags: [] }
        ]);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument());
        fireEvent.click(screen.getByText('CREAR OUTFIT'));

        await waitFor(() => expect(screen.getByText('Prendas Superiores')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Prendas Superiores'));

        await waitFor(() => expect(screen.getByAltText('Item 1')).toBeInTheDocument());

        // Toggle both items rapidly
        fireEvent.click(screen.getByAltText('Item 1').closest('button')!);
        fireEvent.click(screen.getByAltText('Item 2').closest('button')!);

        // Save should NOT have been called yet (no save-per-toggle)
        expect(vi.mocked(wardrobeStorage.saveWeeklyPlan)).not.toHaveBeenCalled();

        // Click "Listo" to close and save
        fireEvent.click(screen.getByText('Listo'));

        // Now save should have been called exactly once with both items
        await waitFor(() => {
            expect(vi.mocked(wardrobeStorage.saveWeeklyPlan)).toHaveBeenCalled();
            const savedPlan = vi.mocked(wardrobeStorage.saveWeeklyPlan).mock.calls[0][0];
            const dateKey = getTodayDateKey();
            expect(savedPlan[dateKey].items).toHaveLength(2);
        }, { timeout: 3000 });
    });

    it('should not save when no changes were made and "Listo" is clicked', async () => {
        const dateKey = getTodayDateKey();
        vi.mocked(wardrobeStorage.loadWeeklyPlan).mockResolvedValue({
            [dateKey]: { day: 'Hoy', date: dateKey, items: [] }
        });
        vi.mocked(wardrobeStorage.saveWeeklyPlan).mockResolvedValue(undefined);

        render(<TodayOutfitWidget />, { wrapper });

        await waitFor(() => expect(screen.getByText('CREAR OUTFIT')).toBeInTheDocument());
        fireEvent.click(screen.getByText('CREAR OUTFIT'));

        // Don't toggle anything, just close
        await waitFor(() => expect(screen.getByText('Listo')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Listo'));

        // Save should NOT have been called since nothing changed
        expect(vi.mocked(wardrobeStorage.saveWeeklyPlan)).not.toHaveBeenCalled();
    });
});
