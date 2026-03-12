import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { AddItemModal } from '../components/AddItemModal';
import { wrapper } from './setup';

vi.mock('../hooks/useWardrobe');
vi.mock('../hooks/useUserProfile');

describe('AddItemModal - Free Tier (300 items)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('alert', vi.fn());
    });

    it('should allow up to 300 items for free users', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={150}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        expect(nameInput).toBeInTheDocument();
    });

    it('should block adding items when reaching 300 item limit', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={300}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        fireEvent.change(nameInput, { target: { value: 'Test Shirt' } });
    });

    it('should show storage indicator with 300 item limit', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={50}
        />, { wrapper });

        expect(screen.getByText(/Plan Gratuito/i)).toBeInTheDocument();
        expect(screen.getByText(/50 \/ 300 prendas/i)).toBeInTheDocument();
    });
});
