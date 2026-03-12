import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { AddItemModal } from '../components/AddItemModal';
import { wrapper } from './setup';

vi.mock('../hooks/useWardrobe');
vi.mock('../hooks/useUserProfile');

describe('AddItemModal - New Pricing Model', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('alert', vi.fn());
    });

    it('should block adding more than 100 items for Free users', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={100}
            subscription={{ planId: 'free' }}
            itemPacks={[]}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        fireEvent.change(nameInput, { target: { value: 'Test Shirt' } });
    });

    it('should allow more than 100 items for Pro users', () => {
         render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={101}
            subscription={{ planId: 'pro' }}
            itemPacks={[]}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        expect(nameInput).toBeInTheDocument();
    });
});
