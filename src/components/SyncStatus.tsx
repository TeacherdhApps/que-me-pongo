
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function SyncStatus() {
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();
    const isSyncing = isFetching > 0 || isMutating > 0;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-100 transition-all duration-500">
            {isSyncing ? (
                <>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600">Sincronizando</span>
                </>
            ) : (
                <>
                    <i className="fas fa-cloud-check text-[10px] text-emerald-500"></i>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Al día</span>
                </>
            )}
        </div>
    );
}
