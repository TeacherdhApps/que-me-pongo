interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3" data-testid="loading-spinner">
            <i className={`fas fa-circle-notch fa-spin ${sizeClasses[size]} text-zinc-300`}></i>
            {text && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-xl">
                {spinner}
            </div>
        );
    }

    return spinner;
}

interface AIStreamingProps {
    content: string;
    isLoading: boolean;
    error?: string | null;
    onRetry?: () => void;
}

export function AIStreaming({ content, isLoading, error, onRetry }: AIStreamingProps) {
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-3xl p-8 border border-violet-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center animate-pulse">
                        <i className="fas fa-sparkles text-white text-xs"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                        IA Generando...
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-violet-200/50 rounded-full animate-pulse w-3/4"></div>
                    <div className="h-4 bg-violet-200/50 rounded-full animate-pulse w-full"></div>
                    <div className="h-4 bg-violet-200/50 rounded-full animate-pulse w-5/6"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-red-500 text-xs"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                        Error de IA
                    </span>
                </div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        );
    }

    if (content) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-3xl p-8 border border-violet-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-sparkles text-white text-xs"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                        Recomendación IA
                    </span>
                </div>
                <div className="prose prose-sm max-w-none">
                    <div
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </div>
        );
    }

    return null;
}

interface ImageUploadProgressProps {
    isUploading: boolean;
    progress?: number;
}

export function ImageUploadProgress({ isUploading, progress }: ImageUploadProgressProps) {
    if (!isUploading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-xl animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-10 w-full max-w-sm text-center space-y-6">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                    <i className="fas fa-cloud-upload-alt text-3xl text-zinc-300 animate-bounce"></i>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800 mb-2">
                        Subiendo Imagen
                    </p>
                    <p className="text-[8px] text-zinc-400 uppercase tracking-widest">
                        Guardando en la nube...
                    </p>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-black transition-all duration-300"
                        style={{ width: `${progress || 60}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 animate-pulse" data-testid="skeleton-card">
            <div className="aspect-square bg-zinc-100 rounded-2xl mb-3"></div>
            <div className="h-4 bg-zinc-100 rounded-full w-3/4 mb-2"></div>
            <div className="h-3 bg-zinc-100 rounded-full w-1/2"></div>
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </>
    );
}
