import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach } from 'vitest';
import { AddItemModal } from '../components/AddItemModal';
import * as wardrobeHooks from '../hooks/useWardrobe';
import * as userHooks from '../hooks/useUserProfile';

// Mock hooks
vi.mock('../hooks/useWardrobe');
vi.mock('../hooks/useUserProfile');

describe('AddItemModal - Pro limits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global window alert
        vi.stubGlobal('alert', vi.fn());
    });

    it('should block adding more than 100 items for Free users', async () => {
        // Mock 100 items and Not Pro
        (wardrobeHooks.useWardrobe as any).mockReturnValue({
            wardrobe: Array(100).fill({ id: 'some-id' }),
            add: vi.fn(),
        });
        (userHooks.useUserProfile as any).mockReturnValue({
            profile: { isPro: false },
        });

        render(<AddItemModal 
            onClose={vi.fn()} 
            onAdd={vi.fn()} 
            currentCount={100}
            isPro={false}
        />);

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        fireEvent.change(nameInput, { target: { value: 'Test Shirt' } });
    });

    it('should allow more than 100 items for Pro users', () => {
         (wardrobeHooks.useWardrobe as any).mockReturnValue({
            wardrobe: Array(101).fill({ id: 'some-id' }),
            add: vi.fn(),
        });
        (userHooks.useUserProfile as any).mockReturnValue({
            profile: { isPro: true },
        });

        render(<AddItemModal 
            onClose={vi.fn()} 
            onAdd={vi.fn()} 
            currentCount={101}
            isPro={true}
        />);
    });
});
