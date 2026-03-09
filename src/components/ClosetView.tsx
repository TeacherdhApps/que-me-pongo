import { useState, memo } from 'react';
import { useWardrobe } from '../hooks/useWardrobe';
import { useUserProfile } from '../hooks/useUserProfile';
import { AddItemModal } from './AddItemModal';
import { Categories } from '../types';
import type { Category, ClothingItem } from '../types';

const categoryLabels: { key: Category; icon: string }[] = [
    { key: Categories.TOP, icon: 'fa-shirt' },
    { key: Categories.BOTTOM, icon: 'fa-socks' },
    { key: Categories.SHOES, icon: 'fa-shoe-prints' },
    { key: Categories.ACCESSORY, icon: 'fa-gem' },
];

/**
 * Memoized ClothingCard to prevent unnecessary re-renders in the grid.
 * Includes a premium loading skeleton and lazy loading.
 */
const ClothingCard = memo(({ item, onRemove }: { item: ClothingItem; onRemove: (id: string, url: string) => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="clothing-card group cursor-pointer animate-fade">
            <div className="aspect-[3/4] bg-zinc-50 rounded-[2.5rem] overflow-hidden relative border border-zinc-100 shadow-sm transition-all group-hover:shadow-md">
                {/* Skeleton Shimmer */}
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 bg-[length:200%_100%] animate-shimmer"></div>
                )}

                <img
                    src={item.image}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                />

                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('¿Estás seguro de que quieres eliminar esta prenda?')) {
                            try {
                                await onRemove(item.id, item.image);
                            } catch (err) {
                                alert('No se pudo eliminar la prenda. Por favor, intenta de nuevo.');
                            }
                        }
                    }}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-50 hover:text-red-500 z-10"
                >
                    <i className="fas fa-times text-[10px]"></i>
                </button>
            </div>
            <div className="mt-4 px-2">
                <p className="text-[10px] font-black uppercase tracking-widest truncate">{item.name}</p>
            </div>
        </div>
    );
});

ClothingCard.displayName = 'ClothingCard';

export function ClosetView() {
    const { wardrobe, isLoading, add, remove } = useWardrobe();
    const { profile } = useUserProfile();
    const [showModal, setShowModal] = useState(false);
    const [openSection, setOpenSection] = useState<Category | null>(null);

    const toggleSection = (cat: Category) => {
        setOpenSection(prev => prev === cat ? null : cat);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4 animate-pulse">
                <i className="fas fa-circle-notch fa-spin text-4xl text-black"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Cargando Armario...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-end mb-16">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Mi Colección</h2>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">
                        {wardrobe.length} Piezas totales
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:rotate-90 transition-transform shadow-lg hover:shadow-xl"
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            <div className="space-y-4">
                {categoryLabels.map(({ key, icon }) => {
                    const items = wardrobe.filter(i => i.category === key);
                    const isOpen = openSection === key;

                    return (
                        <div key={key}>
                            <button
                                onClick={() => toggleSection(key)}
                                className={`w-full flex items-center justify-between px-8 py-6 rounded-[2rem] transition-all ${isOpen ? 'bg-black text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-black'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <i className={`fas ${icon} text-sm ${isOpen ? 'text-white' : 'text-zinc-400'}`}></i>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{key}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-bold ${isOpen ? 'text-zinc-400' : 'text-zinc-300'}`}>
                                        {items.length} {items.length === 1 ? 'pieza' : 'piezas'}
                                    </span>
                                    <i className={`fas fa-chevron-down text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-6 pt-8 pb-4 px-2">
                                    {items.length === 0 ? (
                                        <p className="col-span-full text-center text-zinc-300 text-xs font-bold uppercase tracking-widest py-8">
                                            Sin prendas en esta categoría
                                        </p>
                                    ) : (
                                        items.map(item => (
                                            <ClothingCard key={item.id} item={item} onRemove={remove} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {wardrobe.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <p className="text-zinc-300 font-bold uppercase tracking-widest">Tu armario está vacío</p>
                </div>
            )}

            {showModal && (
                <AddItemModal
                    onClose={() => setShowModal(false)}
                    onAdd={add}
                    currentCount={wardrobe.length}
                    isPro={profile.isPro ?? false}
                />
            )}
        </div>
    );
}
