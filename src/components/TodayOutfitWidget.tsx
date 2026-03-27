
import { useState } from 'react';
import { useWeeklyPlan } from '../hooks/useWardrobe';
import { OutfitEditor } from './OutfitEditor';
import { OutfitPreview } from './OutfitPreview';
import { useWeather } from '../hooks/useWeather';
import { WeatherIcon } from './WeatherIcon';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

export function TodayOutfitWidget() {
    const { plan, updateDay, isLoading } = useWeeklyPlan();
    const { weather } = useWeather();
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);

    const todayDate = new Date();
    const y = todayDate.getFullYear();
    const m = String(todayDate.getMonth() + 1).padStart(2, '0');
    const d = String(todayDate.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const daysKeys: TranslationKey[] = [
        'day.sunday', 'day.monday', 'day.tuesday', 'day.wednesday', 'day.thursday', 'day.friday', 'day.saturday'
    ];
    const dayName = t(daysKeys[todayDate.getDay()]);
    const displayDate = `${d}/${m}/${y}`;

    const todayOutfit = plan[dateKey] || { day: dayName, date: dateKey, items: [] };
    const items = todayOutfit.items;

    const handleClear = async () => {
        if (window.confirm(t('today.confirmClear'))) {
            await updateDay(dateKey, { ...todayOutfit, items: [] });
        }
    };

    if (isLoading) return null;

    return (
        <div className="mb-12">
            <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-widest">{t('today.today')}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{dayName} {displayDate}</span>
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">{t('today.yourOutfit')}</h3>
                        {weather && (
                            <div className="flex items-center gap-2 mt-2 text-zinc-400">
                                <WeatherIcon condition={weather.condition} code={weather.code} className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{weather.temp}°C · {weather.condition}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Preview Circle */}
                        <div className="flex -space-x-4">
                            {items.length > 0 ? (
                                items.slice(0, 4).map(itm => (
                                    <img
                                        key={itm.id}
                                        src={itm.image}
                                        className="w-16 h-16 rounded-full border-4 border-black object-cover shadow-lg"
                                        alt={itm.name}
                                    />
                                ))
                            ) : (
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                                    <i className="fas fa-plus text-zinc-700 text-xs"></i>
                                </div>
                            )}
                            {items.length > 4 && (
                                <div className="w-16 h-16 rounded-full bg-zinc-800 border-4 border-black flex items-center justify-center text-[10px] font-black">
                                    +{items.length - 4}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {items.length > 0 && (
                                <>
                                    <button
                                        onClick={() => setIsViewing(true)}
                                        className="text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-zinc-800 text-white rounded-full hover:bg-white hover:text-black transition-all"
                                    >
                                        {t('today.view')}
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-red-500 hover:text-white transition-all"
                                        title={t('today.clear')}
                                    >
                                        <i className="fas fa-trash-alt text-[10px]"></i>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[10px] font-black uppercase tracking-widest px-8 py-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-all shadow-xl"
                            >
                                {items.length > 0 ? t('today.edit') : t('today.createOutfit')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && (
                <OutfitEditor
                    editingDay={{ name: dayName, date: dateKey }}
                    plan={plan}
                    updateDay={updateDay}
                    onClose={() => setIsEditing(false)}
                />
            )}

            {isViewing && (
                <OutfitPreview
                    outfit={todayOutfit}
                    onClose={() => setIsViewing(false)}
                    onSave={(updates) => updateDay(dateKey, { ...todayOutfit, ...updates })}
                />
            )}
        </div>
    );
}
