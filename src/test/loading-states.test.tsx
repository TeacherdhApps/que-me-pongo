import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import {
    LoadingSpinner,
    AIStreaming,
    ImageUploadProgress,
    SkeletonCard,
    SkeletonList,
} from '../components/ui/LoadingStates';

vi.mock('../hooks/useWardrobe');
vi.mock('../hooks/useUserProfile');

describe('LoadingStates Components', () => {
    describe('LoadingSpinner', () => {
        it('should render default spinner', () => {
            render(<LoadingSpinner />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should render with text', () => {
            render(<LoadingSpinner text="Cargando..." />);
            expect(screen.getByText(/cargando/i)).toBeInTheDocument();
        });

        it('should render small size', () => {
            render(<LoadingSpinner size="sm" />);
            const icon = screen.getByTestId('loading-spinner');
            expect(icon.querySelector('i')).toHaveClass('w-4', 'h-4');
        });

        it('should render full screen mode', () => {
            render(<LoadingSpinner fullScreen />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });
    });

    describe('AIStreaming', () => {
        it('should show loading state', () => {
            render(<AIStreaming content="" isLoading={true} />);
            expect(screen.getByText(/ia generando/i)).toBeInTheDocument();
        });

        it('should show error state with retry button', () => {
            const onRetry = vi.fn();
            render(
                <AIStreaming
                    content=""
                    isLoading={false}
                    error="Error de conexión"
                    onRetry={onRetry}
                />
            );
            expect(screen.getByText(/error de ia/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
        });

        it('should show content', () => {
            render(
                <AIStreaming
                    content="**Camisa Blanca** con **Pantalón Negro**"
                    isLoading={false}
                />
            );
            expect(screen.getByText(/recomendación ia/i)).toBeInTheDocument();
        });

        it('should render null when no content and not loading', () => {
            const { container } = render(
                <AIStreaming content="" isLoading={false} />
            );
            expect(container.firstChild).toBeNull();
        });
    });

    describe('ImageUploadProgress', () => {
        it('should render null when not uploading', () => {
            const { container } = render(<ImageUploadProgress isUploading={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('should show upload progress', () => {
            render(<ImageUploadProgress isUploading={true} progress={50} />);
            expect(screen.getByText(/subiendo imagen/i)).toBeInTheDocument();
        });
    });

    describe('SkeletonCard', () => {
        it('should render skeleton card', () => {
            render(<SkeletonCard />);
            expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
        });
    });

    describe('SkeletonList', () => {
        it('should render multiple skeleton cards', () => {
            render(<SkeletonList count={5} />);
            expect(screen.getAllByTestId('skeleton-card')).toHaveLength(5);
        });

        it('should default to 3 cards', () => {
            render(<SkeletonList />);
            expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
        });
    });
});
