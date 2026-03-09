
interface StorageHealthProps {
    current: number;
    limit: number;
    isPro: boolean;
}

export function StorageHealth({ current, limit, isPro }: StorageHealthProps) {
    if (isPro) return null;

    const percentage = Math.min((current / limit) * 100, 100);
    const isCritical = current >= limit * 0.9;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Espacio de Armario</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isCritical ? 'text-red-500 animate-pulse' : 'text-zinc-800'}`}>
                    {current} / {limit} piezas
                </p>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${isCritical ? 'bg-red-500' : 'bg-black'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            {isCritical && (
                <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest text-center mt-1">
                    ¡Casi lleno! Borra prendas o pásate a PRO.
                </p>
            )}
        </div>
    );
}
