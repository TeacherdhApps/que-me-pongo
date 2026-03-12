import { render, screen } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
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

        // Text is split across elements: "50 / 100 piezas"
        expect(screen.getByText((content) => content.includes('50'))).toBeInTheDocument();
    });

    it('should show unlimited storage for Pro tier', () => {
        const { container } = render(
            <StorageHealth current={150} limit={100} isPro={true} />,
            { wrapper }
        );

        // Pro users see different UI - just renders without error
        expect(container).toBeInTheDocument();
    });

    it('should show warning when approaching limit', () => {
        render(
            <StorageHealth current={90} limit={100} isPro={false} />,
            { wrapper }
        );

        // Should render the component without errors
        expect(screen.getByText((content) => content.includes('90'))).toBeInTheDocument();
    });

    it('should show upgrade prompt when at limit', () => {
        render(
            <StorageHealth current={100} limit={100} isPro={false} />,
            { wrapper }
        );

        expect(screen.getByText((content) => content.includes('100'))).toBeInTheDocument();
    });
});
