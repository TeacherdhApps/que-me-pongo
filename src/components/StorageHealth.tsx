
import { useI18n } from '../i18n/I18nContext';

interface StorageHealthProps {
    current: number;
    limit: number;
    isPro: boolean;
}

export function StorageHealth({ current, limit }: StorageHealthProps) {
    const { t } = useI18n();
    const percentage = Math.min(100, (current / limit) * 100);
    const isAlmostFull = percentage >= 85;

    return (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('storage.title')}</span>
                    <h4 className="text-2xl font-black uppercase tracking-widest">
                        {current} <span className="text-zinc-300 text-sm">/ {limit} {t('storage.pieces')}</span>
                    </h4>
                </div>
                {isAlmostFull && (
                    <div className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full flex items-center gap-2 animate-bounce">
                        <i className="fas fa-exclamation-triangle text-[10px]"></i>
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('storage.almostFull')}</span>
                    </div>
                )}
            </div>
            
            <div className="w-full h-3 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100 p-0.5">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-1 ${
                        percentage > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                        percentage > 70 ? 'bg-yellow-400' : 'bg-black'
                    }`}
                    style={{ width: `${percentage}%` }}
                >
                </div>
            </div>
        </div>
    );
}
