import { useState, memo, useCallback } from 'react';
import { useWardrobe } from '../hooks/useWardrobe';
import { useUserProfile } from '../hooks/useUserProfile';
import { AddItemModal } from './AddItemModal';
import { StorageHealth } from './StorageHealth';
import { TodayOutfitWidget } from './TodayOutfitWidget';
import { Categories } from '../types';
import { FREE_ITEM_LIMIT } from '../lib/pricing';
import type { Category, ClothingItem } from '../types';

const categoryLabels: { key: Category; icon: string }[] = [
    { key: Categories.OUTERWEAR, icon: 'fa-vest' },
    { key: Categories.TOP, icon: 'fa-shirt' },
    { key: Categories.BOTTOM, icon: 'fa-socks' },
    { key: Categories.SHOES, icon: 'fa-shoe-prints' },
];

interface ClothingCardProps {
    item: ClothingItem;
    onRemove: (id: string, url: string) => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

const ClothingCard = memo(({ item, onRemove, isSelectionMode, isSelected, onToggleSelect }: ClothingCardProps) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelect(item.id);
        }
    };

    return (
        <div 
            onClick={handleClick}
            className={`clothing-card group cursor-pointer animate-fade transition-all ${isSelectionMode && isSelected ? 'scale-95' : ''}`}
        >
            <div className={`aspect-[3/4] bg-zinc-50 rounded-[2.5rem] overflow-hidden relative border transition-all ${isSelectionMode && isSelected ? 'border-black ring-4 ring-black/5' : 'border-zinc-100 shadow-sm'}`}>
                {/* Blur-up Placeholder */}
                {item.thumbnail && !isLoaded && (
                    <img 
                        src={item.thumbnail} 
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                        alt=""
                    />
                )}
                
                {/* Skeleton Shimmer (fallback if no thumbnail) */}
                {!isLoaded && !item.thumbnail && (
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 bg-[length:200%_100%] animate-shimmer"></div>
                )}

                <img
                    src={item.image}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${isSelected ? 'opacity-40' : ''}`}
                />

                {isSelectionMode ? (
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-black border-black text-white' : 'bg-white/80 border-zinc-300'}`}>
                        {isSelected && <i className="fas fa-check text-[10px]"></i>}
                    </div>
                ) : (
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Estás seguro de que quieres eliminar esta prenda?')) {
                                try {
                                    await onRemove(item.id, item.image);
                                } catch (err) {
                                    console.error('Delete error:', err);
                                    alert('No se pudo eliminar la prenda. Por favor, intenta de nuevo.');
                                }
                            }
                        }}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-50 hover:text-red-500 z-10"
                    >
                        <i className="fas fa-times text-[10px]"></i>
                    </button>
                )}
            </div>
            <div className="mt-4 px-2">
                <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-zinc-400' : ''}`}>{item.name}</p>
            </div>
        </div>
    );
});

ClothingCard.displayName = 'ClothingCard';

export function ClosetView() {
    const { wardrobe, isLoading, add, remove, bulkRemove } = useWardrobe();
    useUserProfile();
    const [showModal, setShowModal] = useState(false);
    const [openSection, setOpenSection] = useState<Category | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSection = (cat: Category) => {
        setOpenSection(prev => prev === cat ? null : cat);
    };

    const handleRemove = async (id: string, imageUrl?: string) => {
        await remove({ id, imageUrl });
    };

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleBulkRemove = async () => {
        const count = selectedIds.size;
        if (window.confirm(`¿Estás seguro de que quieres eliminar estas ${count} prendas?`)) {
            const itemsToRemove = wardrobe
                .filter(i => selectedIds.has(i.id))
                .map(i => ({ id: i.id, imageUrl: i.image }));
            
            try {
                await bulkRemove(itemsToRemove);
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            } catch (err) {
                alert('Error al eliminar las prendas.');
            }
        }
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
        <div className="animate-fade pb-20">
            {/* Today's Outfit Shortcut */}
            {!isSelectionMode && <TodayOutfitWidget />}

            <div className="flex justify-between items-end mb-16">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Mi Colección</h2>
                    <div className="flex gap-4 mt-2">
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                            {wardrobe.length} Piezas totales
                        </p>
                        <button 
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds(new Set());
                            }}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${isSelectionMode ? 'bg-black text-white' : 'text-zinc-400 hover:bg-zinc-100'}`}
                        >
                            {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                        </button>
                    </div>
                </div>
                {!isSelectionMode && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:rotate-90 transition-transform shadow-lg hover:shadow-xl"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                )}
            </div>

            <div className="mb-12 max-w-md">
                <StorageHealth 
                    current={wardrobe.length} 
                    limit={FREE_ITEM_LIMIT} 
                    isPro={false} 
                />
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
                                            <ClothingCard 
                                                key={item.id} 
                                                item={item} 
                                                onRemove={handleRemove}
                                                isSelectionMode={isSelectionMode}
                                                isSelected={selectedIds.has(item.id)}
                                                onToggleSelect={toggleSelect}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selection Floating Action Bar */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-black text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
                        <span className="text-xs font-black uppercase tracking-widest">
                            {selectedIds.size} seleccionadas
                        </span>
                        <div className="w-px h-4 bg-white/20"></div>
                        <button 
                            onClick={handleBulkRemove}
                            className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-trash-alt"></i> Borrar
                        </button>
                    </div>
                </div>
            )}

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
                />
            )}
        </div>
    );
}
