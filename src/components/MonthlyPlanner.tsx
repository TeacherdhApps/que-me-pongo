
import { useState, useMemo, memo } from 'react';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import { OutfitEditor } from './OutfitEditor';
import { OutfitPreview } from './OutfitPreview';
import type { ClothingItem } from '../types';

interface DayCellProps {
    date: Date;
    outfit?: { items: ClothingItem[] };
    isToday: boolean;
    onEdit: (day: { name: string; date: string }) => void;
    onView: (day: { name: string; date: string; displayDate: string }) => void;
    onSelect: (day: { name: string; date: string; displayDate: string } | null) => void;
    isSelected: boolean;
    dayName: string;
    dateKey: string;
}

const PlannerDayCell = memo(({ date, outfit, isToday, onEdit, onView, onSelect, isSelected, dayName, dateKey }: DayCellProps) => {
    const hasOutfit = outfit && outfit.items.length > 0;

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const displayDate = `${dd}/${mm}/${yyyy}`;

    const handleClick = () => {
        if (hasOutfit) {
            onSelect({ name: dayName, date: dateKey, displayDate });
        } else {
            onEdit({ name: dayName, date: dateKey });
        }
    };

    return (
        <div className="relative aspect-square">
            <button
                onClick={handleClick}
                className={`
                    w-full h-full rounded-2xl p-2 transition-all relative flex flex-col items-center justify-center animate-fade
                    ${isToday ? 'bg-black text-white' : 'bg-white hover:bg-zinc-100'}
                    ${hasOutfit ? 'ring-2 ring-black ring-inset' : ''}
                    ${isSelected ? 'ring-2 ring-indigo-500 scale-105 shadow-lg z-20' : ''}
                `}
            >
                <span className={`text-[10px] font-bold ${isToday ? '' : 'text-zinc-700'}`}>
                    {date.getDate()}
                </span>

                {hasOutfit && (
                    <div className="flex -space-x-1 mt-1">
                        {outfit.items.slice(0, 3).map(itm => (
                            <img
                                key={itm.id}
                                src={itm.image}
                                loading="lazy"
                                className="w-4 h-4 rounded-full border border-white object-cover"
                            />
                        ))}
                        {outfit.items.length > 3 && (
                            <div className="w-4 h-4 rounded-full bg-zinc-100 border border-white flex items-center justify-center text-[6px] font-bold">
                                +{outfit.items.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </button>

            {isSelected && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 flex gap-2 animate-fade">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView({ name: dayName, date: dateKey, displayDate });
                            onSelect(null);
                        }}
                        className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-zinc-50 hover:scale-105 transition-all whitespace-nowrap"
                    >
                        <i className="fas fa-eye mr-1"></i> Ver
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit({ name: dayName, date: dateKey });
                            onSelect(null);
                        }}
                        className="px-4 py-2 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all whitespace-nowrap"
                    >
                        <i className="fas fa-pen mr-1"></i> Editar
                    </button>
                </div>
            )}
        </div>
    );
});

PlannerDayCell.displayName = 'PlannerDayCell';

const MonthlySkeleton = () => (
    <div className="bg-zinc-50 rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 border border-zinc-100 animate-pulse overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-8 min-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-2 w-8 bg-zinc-200 rounded mx-auto"></div>
            ))}
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-4 min-w-[280px]">
            {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white rounded-2xl p-2 flex flex-col items-center justify-center gap-2">
                    <div className="w-4 h-2 bg-zinc-100 rounded"></div>
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-zinc-50 border border-zinc-100"></div>
                        <div className="w-4 h-4 rounded-full bg-zinc-50 border border-zinc-100"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

interface MonthlyPlannerProps {
    onViewChange: (view: 'week' | 'month') => void;
}

export function MonthlyPlanner({ onViewChange }: MonthlyPlannerProps) {
    const { plan, isLoading, updateDay } = useWeeklyPlan();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingDay, setEditingDay] = useState<{ name: string, date: string } | null>(null);
    const [viewingDay, setViewingDay] = useState<{ name: string, date: string, displayDate: string } | null>(null);
    const [selectedDay, setSelectedDay] = useState<{ name: string, date: string, displayDate: string } | null>(null);

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startPadding = (firstDay.getDay() + 6) % 7;

        const days = [];

        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentDate]);

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">
                        {monthNames[currentDate.getMonth()]} <span className="text-zinc-300">{currentDate.getFullYear()}</span>
                    </h2>
                    <div className="flex gap-4 mt-2 mb-4">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[8px] hover:scale-110 transition-transform"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[8px] hover:scale-110 transition-transform"
                        >
                            →
                        </button>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => onViewChange('week')}
                            className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity pb-1"
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => onViewChange('month')}
                            className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1"
                        >
                            Mes
                        </button>
                    </div>
                </div>
            </div>

            {selectedDay && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSelectedDay(null)}
                />
            )}

            {isLoading ? (
                <MonthlySkeleton />
            ) : (
                <div className="bg-zinc-50 rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 border border-zinc-100 relative overflow-x-auto">
                    <div className="grid grid-cols-7 gap-2 md:gap-4 mb-8 min-w-[280px]">
                        {dayNames.map(d => (
                            <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 md:gap-4 min-w-[280px]">
                        {daysInMonth.map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;

                            const dateKey = formatDateKey(date);
                            const outfit = plan[dateKey];
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                                <PlannerDayCell
                                    key={date.toISOString()}
                                    date={date}
                                    outfit={outfit}
                                    isToday={isToday}
                                    onEdit={setEditingDay}
                                    onView={setViewingDay}
                                    onSelect={setSelectedDay}
                                    isSelected={selectedDay?.date === dateKey}
                                    dayName={dayNames[(date.getDay() + 6) % 7]}
                                    dateKey={dateKey}
                                />
                            );
                        })}
                    </div>
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
                    outfit={plan[viewingDay.date] || { day: viewingDay.name, date: viewingDay.date, items: [] }}
                    onClose={() => setViewingDay(null)}
                    onSave={(updates) => updateDay(viewingDay.date, { ...(plan[viewingDay.date] || { day: viewingDay.name, date: viewingDay.date, items: [] }), ...updates })}
                />
            )}
        </div>
    );
}
