
import { useState } from 'react';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import { OutfitEditor } from './OutfitEditor';

export function WeeklyPlanner({ onViewChange }: { onViewChange: (view: 'week' | 'month') => void }) {
    const { plan, isLoading, updateDay } = useWeeklyPlan();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingDay, setEditingDay] = useState<{ name: string, date: string } | null>(null);

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getWeekDays = () => {
        const dayOfWeek = (currentDate.getDay() + 6) % 7; // Monday is 0
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return {
                name: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i],
                date: formatDateKey(date),
                displayDate: `${dd}/${mm}/${yyyy}`
            };
        });
    };

    const weekDays = getWeekDays();

    const changeWeek = (offset: number) => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + (offset * 7));
        setCurrentDate(nextDate);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4 animate-pulse">
                <i className="fas fa-circle-notch fa-spin text-4xl text-black"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Cargando Plan...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Itinerario Semanal</h2>
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => changeWeek(-1)}
                            className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[8px] hover:scale-110 transition-transform"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => changeWeek(1)}
                            className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[8px] hover:scale-110 transition-transform"
                        >
                            →
                        </button>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => onViewChange('week')}
                            className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1"
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => onViewChange('month')}
                            className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity pb-1"
                        >
                            Mes
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {weekDays.map(day => (
                    <div key={day.date} className="bg-zinc-50 rounded-[2rem] p-8 flex items-center justify-between group hover:bg-zinc-100 transition-colors">
                        <div className="flex items-center gap-12">
                            <div className="w-24 flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest">{day.name}</span>
                                <span className="text-[10px] font-bold text-zinc-700 mt-1">{day.displayDate}</span>
                            </div>
                            <div className="flex -space-x-4">
                                {(plan[day.date]?.items || []).map(itm => (
                                    <img key={itm.id} src={itm.image} className="w-12 h-12 rounded-full border-2 border-white object-cover" alt={itm.name} />
                                ))}
                                {(!plan[day.date] || plan[day.date].items.length === 0) && (
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Outfit vacío</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setEditingDay(day)}
                            className="text-[10px] font-black uppercase tracking-widest bg-white px-6 py-3 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Editar
                        </button>
                    </div>
                ))}
            </div>

            {editingDay && (
                <OutfitEditor
                    editingDay={editingDay}
                    plan={plan}
                    updateDay={updateDay}
                    onClose={() => setEditingDay(null)}
                />
            )}
        </div>
    );
}
