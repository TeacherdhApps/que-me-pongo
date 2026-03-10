
import { useState } from 'react';
import { useWeeklyPlan, useWardrobe } from '../hooks/useWardrobe';
import { OutfitEditor } from './OutfitEditor';
import { OutfitPreview } from './OutfitPreview';
import type { ClothingItem } from '../types';

export function TodayOutfitSummary() {
    const { plan, isLoading, updateDay } = useWeeklyPlan();
    const { wardrobe } = useWardrobe();
    const [editingDay, setEditingDay] = useState<{ name: string, date: string } | null>(null);
    const [viewingDay, setViewingDay] = useState<{ name: string, date: string, displayDate: string, items: ClothingItem[] } | null>(null);

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatDisplayDate = (date: Date) => {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const getDayName = (date: Date) => {
        return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayKey = formatDateKey(today);
    const tomorrowKey = formatDateKey(tomorrow);

    const todayOutfit = plan[todayKey];
    const tomorrowOutfit = plan[tomorrowKey];

    const DaySummary = ({ date, outfit, label }: { date: Date, outfit?: any, label: string }) => {
        const hasItems = outfit && outfit.items && outfit.items.length > 0;
        const dateKey = formatDateKey(date);
        const dayName = getDayName(date);
        const displayDate = formatDisplayDate(date);

        return (
            <div className={`flex-1 p-6 rounded-[2.5rem] border transition-all ${hasItems ? 'bg-black text-white border-black shadow-xl scale-[1.02]' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${hasItems ? 'text-zinc-400' : 'text-zinc-300'}`}>{label}</span>
                        <h4 className="text-lg font-black uppercase tracking-tight mt-1">{dayName}</h4>
                        <p className={`text-[9px] font-bold mt-0.5 ${hasItems ? 'text-zinc-500' : 'text-zinc-400'}`}>{displayDate}</p>
                    </div>
                    {hasItems && (
                        <div className="flex -space-x-2">
                            {outfit.items.slice(0, 3).map((itm: ClothingItem) => (
                                <img key={itm.id} src={itm.image} className="w-8 h-8 rounded-full border-2 border-black object-cover" alt="" />
                            ))}
                        </div>
                    )}
                </div>

                {hasItems ? (
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => setViewingDay({ name: dayName, date: dateKey, displayDate, items: outfit.items })}
                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black uppercase tracking-widest rounded-full transition-colors"
                        >
                            Ver
                        </button>
                        <button 
                            onClick={() => setEditingDay({ name: dayName, date: dateKey })}
                            className="flex-1 py-2.5 bg-white text-black hover:bg-zinc-100 text-[9px] font-black uppercase tracking-widest rounded-full transition-colors"
                        >
                            Editar
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setEditingDay({ name: dayName, date: dateKey })}
                        className="w-full mt-4 py-3 bg-white border border-zinc-200 text-black hover:bg-black hover:text-white hover:border-black text-[9px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm"
                    >
                        + Seleccionar Outfit
                    </button>
                )}
            </div>
        );
    };

    if (isLoading && Object.keys(plan).length === 0) return null;
    if (wardrobe.length === 0) return null;

    return (
        <div className="mb-16 animate-fade">
            <div className="flex flex-col sm:flex-row gap-4">
                <DaySummary date={today} outfit={todayOutfit} label="Hoy" />
                <DaySummary date={tomorrow} outfit={tomorrowOutfit} label="Mañana" />
            </div>

            {editingDay && (
                <OutfitEditor
                    editingDay={editingDay}
                    plan={plan}
                    updateDay={updateDay}
                    onClose={() => setEditingDay(null)}
                />
            )}

            {viewingDay && (
                <OutfitPreview
                    items={viewingDay.items}
                    onClose={() => setViewingDay(null)}
                    dayName={viewingDay.name}
                    dateDisplay={viewingDay.displayDate}
                />
            )}
        </div>
    );
}
