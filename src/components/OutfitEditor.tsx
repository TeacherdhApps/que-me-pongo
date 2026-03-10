
import { useState } from 'react';
import { useWardrobe } from '../hooks/useWardrobe';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWeather } from '../hooks/useWeather';
import { useOutfitRecommendation } from '../hooks/useOutfitRecommendation';
import type { ClothingItem, WeeklyPlan, DailyOutfit, Category } from '../types';
import { Categories } from '../types';

interface OutfitEditorProps {
    editingDay: { name: string, date: string };
    plan: WeeklyPlan;
    updateDay: (day: string, update: DailyOutfit | ((old: DailyOutfit) => DailyOutfit)) => void;
    onClose: () => void;
}

export function OutfitEditor({ editingDay, plan, updateDay, onClose }: OutfitEditorProps) {
    const { wardrobe } = useWardrobe();
    const { profile } = useUserProfile();
    const { weather } = useWeather();
    const { recommendation, loading: aiLoading, error: aiError, generateRecommendation } = useOutfitRecommendation();
    const [openSection, setOpenSection] = useState<Category | null>(null);
    const [showAI, setShowAI] = useState(false);

    const toggleSection = (cat: Category) => {
        setOpenSection(prev => prev === cat ? null : cat);
    };

    const formatDisplayDate = (dateKey: string) => {
        const [y, m, d] = dateKey.split('-');
        return `${d}/${m}/${y}`;
    };

    const toggleItemInDay = async (item: ClothingItem) => {
        await updateDay(editingDay.date, (prev) => {
            const currentOutfit = prev || { day: editingDay.name, date: editingDay.date, items: [] };
            const isSelected = currentOutfit.items.find(i => String(i.id) === String(item.id));

            const nextItems = isSelected
                ? currentOutfit.items.filter(i => String(i.id) !== String(item.id))
                : [...currentOutfit.items, item];

            return { ...currentOutfit, day: editingDay.name, date: editingDay.date, items: nextItems };
        });
    };

    return (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-fade">
            <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                    <div className="flex flex-col">
                        <h3 className="text-4xl font-black uppercase tracking-tighter">{editingDay.name}</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-bold text-zinc-400">{formatDisplayDate(editingDay.date)}</span>
                            {weather && (
                                <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">
                                    <i className="fas fa-temperature-half text-[10px] text-zinc-400"></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{weather.temp}°C · {weather.condition}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {profile.isPro && (
                            <button
                                onClick={() => {
                                    setShowAI(true);
                                    if (weather) generateRecommendation(wardrobe, weather);
                                }}
                                disabled={aiLoading || !weather}
                                className={`group flex items-center gap-3 px-6 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${aiLoading ? 'bg-zinc-100 text-zinc-400' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95'}`}
                            >
                                <i className={`fas ${aiLoading ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'} text-xs`}></i>
                                <span>{aiLoading ? 'Creando Magia...' : 'AI Magic'}</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                            Listo
                        </button>
                    </div>
                </div>

                {/* AI Recommendation Display */}
                {showAI && (
                    <div className="mb-8 animate-fade">
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-purple-100 rounded-[2.5rem] p-8 backdrop-blur-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <i className="fas fa-wand-magic-sparkles text-6xl text-purple-600"></i>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Recomendación IA</h4>
                                <button
                                    onClick={() => setShowAI(false)}
                                    className="text-zinc-400 hover:text-black transition-colors"
                                >
                                    <i className="fas fa-times text-xs"></i>
                                </button>
                            </div>

                            {aiError ? (
                                <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                                    {aiError}
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-zinc-800 font-medium leading-relaxed whitespace-pre-wrap">
                                        {recommendation || 'Consultando a tu estilista personal...'}
                                        {aiLoading && <span className="inline-block w-1.5 h-4 bg-purple-400 ml-1 animate-pulse"></span>}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto no-scrollbar pb-12 space-y-3">
                    {([
                        { key: Categories.TOP, icon: 'fa-shirt' },
                        { key: Categories.BOTTOM, icon: 'fa-socks' },
                        { key: Categories.SHOES, icon: 'fa-shoe-prints' },
                        { key: Categories.ACCESSORY, icon: 'fa-gem' },
                    ] as const).map(({ key, icon }) => {
                        const items = wardrobe.filter(item => item.category === key);
                        if (items.length === 0) return null;
                        const isOpen = openSection === key;

                        return (
                            <div key={key} className="space-y-4">
                                <button
                                    onClick={() => toggleSection(key)}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all ${isOpen ? 'bg-black text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-black'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <i className={`fas ${icon} text-[10px] ${isOpen ? 'text-white' : 'text-zinc-400'}`}></i>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{key}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-bold ${isOpen ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                            {items.length} {items.length === 1 ? 'pieza' : 'piezas'}
                                        </span>
                                        <i className={`fas fa-chevron-down text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2 animate-fade py-4">
                                        {items.map(item => {
                                            const active = plan[editingDay.date]?.items.find(i => String(i.id) === String(item.id));
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleItemInDay(item)}
                                                    className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden transition-all shadow-sm group ${active ? 'ring-4 ring-black scale-95 shadow-xl' : 'opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                                    {active && (
                                                        <div className="absolute top-3 right-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center z-10">
                                                            <i className="fas fa-check text-[10px]"></i>
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm py-2 px-3 text-[8px] font-bold text-white uppercase tracking-widest translate-y-full transition-transform group-hover:translate-y-0">
                                                        {item.name}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
