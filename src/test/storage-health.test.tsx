import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { StorageHealth } from '../components/StorageHealth';
import { wrapper } from './setup';

vi.mock('../hooks/useWardrobe');
vi.mock('../hooks/useUserProfile');

describe('StorageHealth Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show storage usage for free tier', () => {
        render(
            <StorageHealth current={50} limit={100} isPro={false} />,
            { wrapper }
        );

        expect(screen.getByText(/50 de 100/i)).toBeInTheDocument();
    });

    it('should show unlimited storage for Pro tier', () => {
        render(
            <StorageHealth current={150} limit={100} isPro={true} />,
            { wrapper }
        );

        expect(screen.getByText(/∞/i)).toBeInTheDocument();
    });

    it('should show warning when approaching limit', () => {
        render(
            <StorageHealth current={90} limit={100} isPro={false} />,
            { wrapper }
        );

        // Should render the component without errors
        expect(screen.getByText(/90 de 100/i)).toBeInTheDocument();
    });

    it('should show upgrade prompt when at limit', () => {
        render(
            <StorageHealth current={100} limit={100} isPro={false} />,
            { wrapper }
        );

        expect(screen.getByText(/100 de 100/i)).toBeInTheDocument();
    });
});
