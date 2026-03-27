
import { useState } from 'react';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import { OutfitEditor } from './OutfitEditor';
import { OutfitPreview } from './OutfitPreview';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

export function MonthlyPlanner({ onViewChange }: { onViewChange: (view: 'week' | 'month') => void }) {
    const { plan, isLoading, updateDay } = useWeeklyPlan();
    const { t } = useI18n();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [editingDay, setEditingDay] = useState<{ name: string, date: string } | null>(null);
    const [viewingDay, setViewingDay] = useState<{ name: string, date: string } | null>(null);

    const formatMonthYear = (date: Date) => {
        const monthsKeys: TranslationKey[] = [
            'month.january', 'month.february', 'month.march', 'month.april', 'month.may', 'month.june',
            'month.july', 'month.august', 'month.september', 'month.october', 'month.november', 'month.december'
        ];
        return `${t(monthsKeys[date.getMonth()])} ${date.getFullYear()}`;
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start (0=Monday, 6=Sunday)
        const emptyDays = (firstDayOfMonth + 6) % 7;
        const days = [];

        for (let i = 0; i < emptyDays; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const days = getDaysInMonth();
    const dayAbbreviationsKeys: TranslationKey[] = [
        'day.mon', 'day.tue', 'day.wed', 'day.thu', 'day.fri', 'day.sat', 'day.sun'
    ];
    const dayNamesKeys: TranslationKey[] = [
        'day.monday', 'day.tuesday', 'day.wednesday', 'day.thursday', 'day.friday', 'day.saturday', 'day.sunday'
    ];

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{t('weekly.title')}</h2>
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => onViewChange('week')}
                            className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity pb-1"
                        >
                            {t('weekly.week')}
                        </button>
                        <button
                            onClick={() => onViewChange('month')}
                            className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1"
                        >
                            {t('weekly.month')}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={prevMonth}
                        className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                        <i className="fas fa-chevron-left text-xs"></i>
                    </button>
                    <span className="text-[11px] font-black uppercase tracking-widest min-w-[120px] text-center">{formatMonthYear(currentMonth)}</span>
                    <button
                        onClick={nextMonth}
                        className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                        <i className="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-7 gap-2 md:gap-4 ${isLoading ? 'opacity-20 pointer-events-none' : ''}`}>
                {dayAbbreviationsKeys.map(dKey => (
                    <div key={dKey} className="text-center py-4 text-[9px] font-black uppercase tracking-widest text-zinc-300">{t(dKey)}</div>
                ))}
                {days.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="aspect-square bg-zinc-50/10 rounded-3xl" />;
                    const dateKey = formatDateKey(date);
                    const isToday = dateKey === formatDateKey(new Date());
                    const dOutfit = plan[dateKey];
                    const items = dOutfit?.items || [];

                    return (
                        <div
                            key={dateKey}
                            className={`aspect-square group relative rounded-3xl lg:rounded-[2rem] border transition-all ${isToday ? 'bg-black text-white shadow-xl' : 'bg-zinc-50 hover:bg-zinc-100 border-transparent hover:border-zinc-200'}`}
                        >
                            <div className="absolute top-2 left-3 md:top-4 md:left-6">
                                <span className={`text-[10px] md:text-sm font-black ${isToday ? 'text-white' : 'text-zinc-400 group-hover:text-black'}`}>{date.getDate()}</span>
                            </div>
                            
                            <div className="w-full h-full flex items-center justify-center p-2 lg:p-4">
                                {items.length > 0 ? (
                                    <div className="flex -space-x-4">
                                        {items.slice(0, 2).map((itm, idx) => (
                                            <img
                                                key={itm.id}
                                                src={itm.image}
                                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${isToday ? 'border-black' : 'border-white'} object-cover shadow-sm transition-transform group-hover:scale-110`}
                                                style={{ zIndex: 10 - idx }}
                                                alt={itm.name}
                                            />
                                        ))}
                                        {items.length > 2 && (
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border-2 border-white flex items-center justify-center text-[8px] font-black text-white" style={{ zIndex: 1 }}>
                                                +{items.length - 2}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setEditingDay({ name: t(dayNamesKeys[date.getDay() === 0 ? 6 : date.getDay() - 1]), date: dateKey })}
                                        className={`w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isToday ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-300'}`}
                                    >
                                        <i className="fas fa-plus text-[10px]"></i>
                                    </button>
                                )}
                            </div>

                            {/* Mobile/Quick Actions Overlay */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all p-1 bg-white/20 backdrop-blur-[2px] rounded-3xl lg:rounded-[2rem]">
                                {items.length > 0 && (
                                    <button
                                        onClick={() => setViewingDay({ name: t(dayNamesKeys[date.getDay() === 0 ? 6 : date.getDay() - 1]), date: dateKey })}
                                        className="w-8 h-8 md:w-10 md:h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                        title={t('monthly.view')}
                                    >
                                        <i className="fas fa-eye text-[9px]"></i>
                                    </button>
                                )}
                                <button
                                    onClick={() => setEditingDay({ name: t(dayNamesKeys[date.getDay() === 0 ? 6 : date.getDay() - 1]), date: dateKey })}
                                    className="w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                    title={t('monthly.edit')}
                                >
                                    <i className="fas fa-pen text-[9px]"></i>
                                </button>
                            </div>
                        </div>
                    );
                })}
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
                    outfit={plan[viewingDay.date] || { day: viewingDay.name, date: viewingDay.date, items: [] }}
                    onClose={() => setViewingDay(null)}
                    onSave={(updates) => updateDay(viewingDay.date, { ...(plan[viewingDay.date] || { day: viewingDay.name, date: viewingDay.date, items: [] }), ...updates })}
                />
            )}
        </div>
    );
}
