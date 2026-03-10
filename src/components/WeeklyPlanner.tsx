
import { useState, memo } from 'react';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import { OutfitEditor } from './OutfitEditor';
import { OutfitPreview } from './OutfitPreview';
import type { ClothingItem } from '../types';

interface DayInfo {
    name: string;
    date: string;
    displayDate: string;
}

const PlannerDayCard = memo(({ day, items, onEdit, onView, isToday }: {
    day: DayInfo;
    items: ClothingItem[];
    onEdit: (day: DayInfo) => void;
    onView: (day: DayInfo) => void;
    isToday: boolean;
}) => {
    return (
        <div className={`rounded-[2rem] p-8 flex items-center justify-between group transition-colors animate-fade ${isToday ? 'bg-black text-white ring-4 ring-black/10' : 'bg-zinc-50 hover:bg-zinc-100'}`}>
            <div className="flex items-center gap-12">
                <div className="w-24 flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-white' : 'text-black'}`}>{day.name}</span>
                        {isToday && (
                            <span className="bg-white text-black text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Hoy</span>
                        )}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 ${isToday ? 'text-zinc-400' : 'text-zinc-700'}`}>{day.displayDate}</span>
                </div>
                <div className="flex -space-x-4">
                    {items.map(itm => (
                        <img
                            key={itm.id}
                            src={itm.image}
                            loading="lazy"
                            className="w-12 h-12 rounded-full border-2 border-white object-cover"
                            alt={itm.name}
                        />
                    ))}
                    {items.length === 0 && (
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Outfit vacío</span>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                {items.length > 0 && (
                    <button
                        onClick={() => onView(day)}
                        className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all ${isToday ? 'bg-zinc-800 text-white hover:bg-white hover:text-black' : 'bg-zinc-100 hover:bg-black hover:text-white'}`}
                    >
                        VER
                    </button>
                )}
                <button
                    onClick={() => onEdit(day)}
                    className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-sm transition-all border ${isToday ? 'bg-white text-black hover:bg-zinc-200 border-white' : 'bg-white hover:bg-zinc-50 border-zinc-100'}`}
                >
                    EDITAR
                </button>
            </div>
        </div>
    );
});

PlannerDayCard.displayName = 'PlannerDayCard';

const WeeklySkeleton = () => (
    <div className="grid gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="bg-zinc-50 rounded-[2rem] p-8 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <div className="w-24 space-y-2">
                        <div className="h-2 w-16 bg-zinc-200 rounded"></div>
                        <div className="h-2 w-12 bg-zinc-100 rounded"></div>
                    </div>
                    <div className="flex -space-x-4">
                        {[1, 2, 3].map(j => (
                            <div key={j} className="w-12 h-12 rounded-full bg-zinc-200 border-2 border-white"></div>
                        ))}
                    </div>
                </div>
                <div className="w-20 h-8 bg-zinc-200 rounded-full"></div>
            </div>
        ))}
    </div>
);

export function WeeklyPlanner({ onViewChange }: { onViewChange: (view: 'week' | 'month') => void }) {
    const { plan, isLoading, updateDay } = useWeeklyPlan();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingDay, setEditingDay] = useState<DayInfo | null>(null);
    const [viewingDay, setViewingDay] = useState<DayInfo | null>(null);

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

            {isLoading ? (
                <WeeklySkeleton />
            ) : (
                <div className="grid gap-4">
                    {weekDays.map(day => {
                        const isToday = day.date === formatDateKey(new Date());
                        return (
                            <PlannerDayCard
                                key={day.date}
                                day={day}
                                items={plan[day.date]?.items || []}
                                onEdit={setEditingDay}
                                onView={setViewingDay}
                                isToday={isToday}
                            />
                        );
                    })}
                </div>
            )}

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
                    items={plan[viewingDay.date]?.items || []}
                    onClose={() => setViewingDay(null)}
                    dayName={viewingDay.name}
                    dateDisplay={viewingDay.displayDate}
                />
            )}
        </div>
    );
}
