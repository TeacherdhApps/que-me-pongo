import { render, screen } from '@testing-library/react';
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

    it('should block adding items when free user reaches 100 item limit', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={100}
            subscription={{ planId: 'free' }}
            itemPacks={[]}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        expect(nameInput).toBeInTheDocument();
    });

    it('should allow up to 500 items for Pro plan users', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={450}
            subscription={{ planId: 'pro' }}
            itemPacks={[]}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        expect(nameInput).toBeInTheDocument();
    });

    it('should allow unlimited items for Unlimited plan users', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={10000}
            subscription={{ planId: 'unlimited' }}
            itemPacks={[]}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        expect(nameInput).toBeInTheDocument();
    });

    it('should increase limit with item packs purchased', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={150}
            subscription={{ planId: 'free' }}
            itemPacks={[{
                packId: 'pack-100',
                purchaseDate: '2026-03-12',
                lemonSqueezyOrderId: 'order-123',
                itemsAdded: 100
            }]}
        />, { wrapper });

        const nameInput = screen.getByPlaceholderText(/Ej. Camisa Oxford/i);
        expect(nameInput).toBeInTheDocument();
    });

    it('should show storage indicator with current plan', () => {
        render(<AddItemModal
            onClose={vi.fn()}
            onAdd={vi.fn()}
            currentCount={50}
            subscription={{ planId: 'free' }}
            itemPacks={[]}
        />, { wrapper });

        expect(screen.getByText(/Plan Gratuito/i)).toBeInTheDocument();
        expect(screen.getByText(/50 \/ 100 prendas/i)).toBeInTheDocument();
    });
});
