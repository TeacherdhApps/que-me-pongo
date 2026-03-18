import React, { useState, useRef, useEffect } from 'react';
import type { ClothingItem, DailyOutfit, CanvasLayout, Position } from '../types';
import { useWardrobe } from '../hooks/useWardrobe';

interface OutfitPreviewProps {
    outfit: DailyOutfit;
    onClose: () => void;
    onSave: (updates: Partial<DailyOutfit>) => Promise<void>;
}

interface DraggableItemProps {
    item: ClothingItem;
    position: Position;
    onUpdate: (pos: Partial<Position>) => void;
    bringToFront: () => void;
    onRemove?: () => void;
}

const DraggableItem = ({ item, position, onUpdate, bringToFront, onRemove }: DraggableItemProps) => {
    const { x, y, w, h, zIndex } = position;
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    const dragStart = useRef({ x: 0, y: 0 });
    const posStart = useRef({ x: 0, y: 0 });
    const sizeStart = useRef({ w: 0, h: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isResizing) return;
        setIsDragging(true);
        bringToFront();
        dragStart.current = { x: e.clientX, y: e.clientY };
        posStart.current = { x, y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        onUpdate({ x: posStart.current.x + dx, y: posStart.current.y + dy });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    const handleResizePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        bringToFront();
        dragStart.current = { x: e.clientX, y: e.clientY };
        sizeStart.current = { w, h };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleResizePointerMove = (e: React.PointerEvent) => {
        if (!isResizing) return;
        e.stopPropagation();
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const delta = Math.max(dx, dy); 
        const newSize = Math.max(70, Math.min(400, sizeStart.current.w + delta));
        onUpdate({ w: newSize, h: newSize });
    };

    const handleResizePointerUp = (e: React.PointerEvent) => {
        if (isResizing) {
            setIsResizing(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                top: `${y}px`,
                left: `${x}px`,
                width: `${w}px`,
                height: `${h}px`,
                zIndex: isDragging || isResizing ? 9999 : zIndex,
                position: 'absolute',
                touchAction: 'none'
            }}
            className={`flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all group ${isDragging || isResizing ? 'ring-2 ring-black/20 scale-105' : 'hover:ring-1 hover:ring-zinc-200'}`}
        >
            <div className="w-full h-full flex flex-col items-center pointer-events-none relative">
                <img src={item.image} className="w-full h-full object-contain" alt={item.name} draggable="false" />
                <span className="text-[7px] font-black uppercase tracking-widest text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 bg-white/80 px-2 py-0.5 rounded-full border border-zinc-100 shadow-sm whitespace-nowrap">{item.name}</span>
            </div>

            {/* Resize Handle */}
            <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                className="absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 bg-black text-white rounded-full shadow-lg transition-all z-[100] hover:scale-110"
                style={{ touchAction: 'none' }}
            >
                <i className="fas fa-expand-alt text-[8px] transform rotate-90"></i>
            </div>

            {/* Remove Button */}
            {onRemove && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full shadow-lg transition-all z-[100] hover:scale-110"
                >
                    <i className="fas fa-times text-[8px]"></i>
                </button>
            )}
        </div>
    );
};

export function OutfitPreview({ outfit, onClose, onSave }: OutfitPreviewProps) {
    const { wardrobe } = useWardrobe();
    const [canvasItems, setCanvasItems] = useState<ClothingItem[]>(outfit.items);
    const [layout, setLayout] = useState<CanvasLayout>(outfit.canvasLayout || {});
    const [background, setBackground] = useState(outfit.canvasBackground || 'dots');
    const [isSaving, setIsSaving] = useState(false);
    const [showItemPicker, setShowItemPicker] = useState(false);

    const [maxZ, setMaxZ] = useState(() => {
        const indices = Object.values(outfit.canvasLayout || {}).map(p => p.zIndex);
        return indices.length > 0 ? Math.max(...indices) : 10;
    });

    // Ensure all current items have a default layout position
    useEffect(() => {
        const newLayout = { ...layout };
        let changed = false;

        canvasItems.forEach((item, index) => {
            if (!newLayout[item.id]) {
                newLayout[item.id] = {
                    x: 50 + (index * 40),
                    y: 50 + (index * 40),
                    w: 150,
                    h: 150,
                    zIndex: index + 1
                };
                changed = true;
            }
        });

        if (changed) setLayout(newLayout);
    }, [canvasItems]);

    const updateItemPosition = (id: string, updates: Partial<Position>) => {
        setLayout(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
    };

    const bringToFront = (id: string) => {
        const nextZ = maxZ + 1;
        setMaxZ(nextZ);
        updateItemPosition(id, { zIndex: nextZ });
    };

    const removeItem = (id: string) => {
        setCanvasItems(prev => prev.filter(item => item.id !== id));
        const nextLayout = { ...layout };
        delete nextLayout[id];
        setLayout(nextLayout);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                items: canvasItems,
                canvasLayout: layout,
                canvasBackground: background
            });
            onClose();
        } catch (err) {
            console.error('Error saving outfit layout:', err);
            alert('Error al guardar el diseño.');
        } finally {
            setIsSaving(false);
        }
    };

    const backgrounds = [
        { id: 'dots', name: 'Original', class: 'bg-zinc-50', style: { backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' } },
        { id: 'marble', name: 'Mármol', class: 'bg-white', style: { backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-marble.png")' } },
        { id: 'wood', name: 'Madera', class: 'bg-[#fdfcf0]', style: { backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' } },
        { id: 'studio', name: 'Estudio', class: 'bg-gradient-to-b from-zinc-100 to-zinc-300' },
        { id: 'minimal', name: 'Limpio', class: 'bg-white' }
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-6 md:p-8 w-full max-w-4xl flex flex-col items-center overflow-hidden h-[90vh]">
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Crea tu Look</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                            {outfit.day} · {canvasItems.length} Prendas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowItemPicker(true)}
                            className="h-10 px-4 flex items-center gap-2 bg-zinc-100 rounded-full hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                            <i className="fas fa-plus"></i> Añadir Prenda
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                            <i className="fas fa-times text-zinc-500"></i>
                        </button>
                    </div>
                </div>

                {/* Background Selector */}
                <div className="flex gap-3 mb-4 w-full overflow-x-auto pb-2 px-2 no-scrollbar">
                    {backgrounds.map(bg => (
                        <button
                            key={bg.id}
                            onClick={() => setBackground(bg.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border ${background === bg.id ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100'}`}
                        >
                            {bg.name}
                        </button>
                    ))}
                </div>

                {/* Canvas Area */}
                <div 
                    className={`relative w-full flex-grow rounded-3xl border-2 border-dashed border-zinc-200 overflow-hidden mb-6 shadow-inner transition-all ${backgrounds.find(b => b.id === background)?.class}`} 
                    style={backgrounds.find(b => b.id === background)?.style}
                >
                    {canvasItems.map((item) => (
                        layout[item.id] && (
                            <DraggableItem 
                                key={item.id}
                                item={item} 
                                position={layout[item.id]} 
                                onUpdate={(upd) => updateItemPosition(item.id, upd)}
                                bringToFront={() => bringToFront(item.id)}
                                onRemove={() => removeItem(item.id)}
                            />
                        )
                    ))}
                    
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2 rounded-full border border-zinc-100 shadow-sm pointer-events-none">
                            <i className="fas fa-wand-magic-sparkles text-[10px] text-zinc-400"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Moodboard Personalizado</span>
                        </div>
                    </div>
                </div>

                <div className="w-full flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar y Cerrar'}
                    </button>
                </div>
            </div>

            {/* Item Picker Modal Overlay */}
            {showItemPicker && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Tu Armario</h3>
                            <button onClick={() => setShowItemPicker(false)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                                <i className="fas fa-times text-zinc-400"></i>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-4 no-scrollbar">
                            {wardrobe.filter(wi => !canvasItems.find(ci => ci.id === wi.id)).map(witem => (
                                <button
                                    key={witem.id}
                                    onClick={() => {
                                        setCanvasItems([...canvasItems, witem]);
                                        setShowItemPicker(false);
                                    }}
                                    className="aspect-square bg-zinc-50 rounded-2xl p-2 border border-zinc-100 hover:border-black transition-all group overflow-hidden relative"
                                >
                                    <img src={witem.image} className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-110" alt={witem.name} />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex flex-col items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Añadir</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
