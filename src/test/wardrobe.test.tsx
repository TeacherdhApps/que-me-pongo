import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { AddItemModal } from '../components/AddItemModal';
import { wrapper } from './setup';

vi.mock('../hooks/useWardrobe');
vi.mock('../hooks/useUserProfile');

describe('AddItemModal - Free Tier', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('alert', vi.fn());
    });

    it('should allow adding items under 200 limit', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={100}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        fireEvent.change(nameInput, { target: { value: 'Test Shirt' } });
    });

    it('should block at 200 items', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={200}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        fireEvent.change(nameInput, { target: { value: 'Test Shirt' } });
    });
});
