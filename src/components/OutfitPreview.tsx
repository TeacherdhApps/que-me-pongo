import React, { useState, useRef, useEffect } from 'react';
import type { ClothingItem, DailyOutfit, CanvasLayout, Position, Category } from '../types';
import { Categories } from '../types';
import { useWardrobe } from '../hooks/useWardrobe';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import { toPng } from 'html-to-image';
import { copyOutfit } from '../lib/outfitClipboard';

interface OutfitPreviewProps {
    outfit: DailyOutfit;
    onClose: () => void;
    onSave: (updates: Partial<DailyOutfit>) => Promise<void>;
}

// Map category values to translation keys
const categoryTranslationKeys: Record<string, TranslationKey> = {
    [Categories.OUTERWEAR]: 'category.outerwear',
    [Categories.TOP]: 'category.top',
    [Categories.BOTTOM]: 'category.bottom',
    [Categories.SHOES]: 'category.shoes',
};

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
                <img src={item.image} crossOrigin="anonymous" className="w-full h-full object-contain" alt={item.name} draggable="false" />
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
    const { t } = useI18n();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasItems, setCanvasItems] = useState<ClothingItem[]>(outfit.items);
    const [layout, setLayout] = useState<CanvasLayout>(outfit.canvasLayout || {});
    const [background, setBackground] = useState('dots');
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [pickerOpenSection, setPickerOpenSection] = useState<Category | null>(null);
    const [notes, setNotes] = useState(outfit.notes || outfit.event || '');

    const downloadBoard = async () => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        try {
            // Short delay to let any rendering/hover states settle
            await new Promise(resolve => setTimeout(resolve, 150));
            const dataUrl = await toPng(canvasRef.current, {
                cacheBust: true,
                style: {
                    borderRadius: '0px',
                    border: 'none',
                }
            });
            const link = document.createElement('a');
            link.download = `outfit-${outfit.day || 'moodboard'}-${outfit.date || 'date'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error exporting outfit board:', err);
            alert(t('outfit.downloadError'));
        } finally {
            setIsDownloading(false);
        }
    };

    const copyLook = () => {
        try {
            copyOutfit({
                ...outfit,
                items: canvasItems,
                canvasLayout: layout,
                canvasBackground: background,
                notes: notes.trim()
            });
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Error copying outfit:', err);
            alert(t('outfit.copyError'));
        }
    };

    const [maxZ, setMaxZ] = useState(() => {
        const indices = Object.values(outfit.canvasLayout || {}).map(p => p.zIndex);
        return indices.length > 0 ? Math.max(...indices) : 10;
    });

    // Ensure all current items have a default layout position that fits the canvas width
    useEffect(() => {
        const canvasWidth = canvasRef.current?.clientWidth ?? 360;
        const baseSize = Math.min(150, Math.max(90, canvasWidth * 0.4));
        const offset = Math.max(16, baseSize * 0.25);
        const newLayout = { ...layout };
        let changed = false;

        canvasItems.forEach((item, index) => {
            if (!newLayout[item.id]) {
                newLayout[item.id] = {
                    x: Math.max(0, Math.min(offset + (index * offset), canvasWidth - baseSize)),
                    y: offset + (index * offset),
                    w: baseSize,
                    h: baseSize,
                    zIndex: index + 1
                };
                changed = true;
            }
        });

        if (changed) setLayout(newLayout);
    }, [canvasItems]);

    // Keep every garment inside the canvas when the viewport (mobile width) changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const clampLayout = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (!width || !height) return;

            setLayout(prev => {
                let changed = false;
                const next = { ...prev };

                Object.keys(next).forEach(id => {
                    const pos = next[id];
                    const w = Math.min(pos.w, width);
                    const h = Math.min(pos.h, height);
                    const x = Math.max(0, Math.min(pos.x, width - w));
                    const y = Math.max(0, Math.min(pos.y, height - h));

                    if (w !== pos.w || h !== pos.h || x !== pos.x || y !== pos.y) {
                        next[id] = { ...pos, w, h, x, y };
                        changed = true;
                    }
                });

                return changed ? next : prev;
            });
        };

        clampLayout();
        window.addEventListener('resize', clampLayout);
        return () => window.removeEventListener('resize', clampLayout);
    }, [canvasItems.length]);

    const updateItemPosition = (id: string, updates: Partial<Position>) => {
        setLayout(prev => {
            const current = prev[id];
            if (!current) return prev;

            const maxW = canvasRef.current?.clientWidth;
            const maxH = canvasRef.current?.clientHeight;
            const next = {
                ...current,
                ...updates,
                x: updates.x ?? current.x,
                y: updates.y ?? current.y,
                w: updates.w ?? current.w,
                h: updates.h ?? current.h
            };

            if (maxW) {
                next.w = Math.min(next.w, maxW);
                next.x = Math.max(0, Math.min(next.x, maxW - next.w));
            }
            if (maxH) {
                next.h = Math.min(next.h, maxH);
                next.y = Math.max(0, Math.min(next.y, maxH - next.h));
            }

            return { ...prev, [id]: next };
        });
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
                canvasBackground: background,
                notes: notes.trim()
            });
            onClose();
        } catch (err) {
            console.error('Error saving outfit layout:', err);
            alert(t('outfit.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const backgrounds = [
        { id: 'dots', name: t('outfit.bgOriginal'), class: 'bg-zinc-50', style: { backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' } }
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-zinc-900/60 backdrop-blur-md animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[2rem] sm:rounded-[3rem] p-3 sm:p-6 md:p-8 w-full max-w-4xl flex flex-col items-center overflow-y-auto overflow-x-hidden h-[95vh]">
                <div className="w-full flex justify-between items-center mb-4 px-2">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t('outfit.createLook')}</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                            {outfit.day} · {canvasItems.length} {t('outfit.garments')}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                        <i className="fas fa-times text-zinc-500"></i>
                    </button>
                </div>

                {/* Symmetric Actions */}
                <div className="grid grid-cols-3 gap-2 w-full mb-4 px-2">
                    <button
                        onClick={() => setShowItemPicker(true)}
                        className="h-11 flex items-center justify-center gap-1.5 bg-zinc-100 rounded-full hover:bg-black hover:text-white transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
                    >
                        <i className="fas fa-plus"></i>
                        <span className="truncate">{t('outfit.add')}</span>
                    </button>
                    <button
                        onClick={copyLook}
                        className="h-11 flex items-center justify-center gap-1.5 bg-zinc-100 rounded-full hover:bg-black hover:text-white transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
                        title={t('outfit.copy')}
                    >
                        <i className={`fas ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                        <span className="truncate">{isCopied ? t('outfit.copied') : t('outfit.copy')}</span>
                    </button>
                    <button
                        onClick={() => { void downloadBoard(); }}
                        disabled={isDownloading}
                        className="h-11 flex items-center justify-center gap-1.5 bg-zinc-100 rounded-full hover:bg-black hover:text-white transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        title={t('outfit.download')}
                    >
                        <i className={`fas ${isDownloading ? 'fa-circle-notch fa-spin' : 'fa-download'}`}></i>
                        <span className="truncate">{isDownloading ? t('outfit.downloading') : t('outfit.download')}</span>
                    </button>
                </div>

                {/* Note / Label Input */}
                <div className="w-full mb-4 px-2">
                    <div className="relative flex items-center">
                        <span className="absolute left-4 text-zinc-400">
                            <i className="fas fa-tag text-xs"></i>
                        </span>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('outfit.notesPlaceholder')}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-zinc-700"
                        />
                    </div>
                </div>

                {/* Background Selector */}
                {backgrounds.length > 1 && (
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
                )}

                {/* Canvas Area */}
                <div 
                    ref={canvasRef}
                    className={`relative w-full flex-1 min-h-[62.5vh] flex-shrink-0 rounded-3xl border-2 border-dashed border-zinc-200 overflow-hidden mb-6 shadow-inner transition-all ${backgrounds.find(b => b.id === background)?.class}`} 
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
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{t('outfit.moodboard')}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                        {t('outfit.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                    >
                        {isSaving ? t('outfit.saving') : t('outfit.saveAndClose')}
                    </button>
                </div>
            </div>

            {/* Item Picker Modal Overlay */}
            {showItemPicker && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade">
                    <div className="bg-white rounded-[3rem] p-6 md:p-10 w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{t('outfit.yourCloset')}</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{t('outfit.selectByCategory')}</p>
                            </div>
                            <button onClick={() => { setShowItemPicker(false); setPickerOpenSection(null); }} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                                <i className="fas fa-times text-zinc-400"></i>
                            </button>
                        </div>
                        <div className="overflow-y-auto pr-2 no-scrollbar space-y-3 flex-1">
                            {([
                                { key: Categories.OUTERWEAR, icon: 'fa-vest' },
                                { key: Categories.TOP, icon: 'fa-shirt' },
                                { key: Categories.BOTTOM, icon: 'fa-socks' },
                                { key: Categories.SHOES, icon: 'fa-shoe-prints' },
                            ] as const).map(({ key, icon }) => {
                                const availableItems = wardrobe.filter(wi => wi.category === key && !canvasItems.find(ci => ci.id === wi.id));
                                if (availableItems.length === 0) return null;
                                const isOpen = pickerOpenSection === key;

                                return (
                                    <div key={key} className="space-y-3">
                                        <button
                                            onClick={() => setPickerOpenSection(prev => prev === key ? null : key)}
                                            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all ${isOpen ? 'bg-black text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-black'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <i className={`fas ${icon} text-[10px] ${isOpen ? 'text-white' : 'text-zinc-400'}`}></i>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t(categoryTranslationKeys[key])}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold ${isOpen ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                                    {availableItems.length} {availableItems.length === 1 ? t('closet.piece') : t('closet.pieces')}
                                                </span>
                                                <i className={`fas fa-chevron-down text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-1 animate-fade py-2">
                                                {availableItems.map(witem => (
                                                    <button
                                                        key={witem.id}
                                                        onClick={() => {
                                                            setCanvasItems([...canvasItems, witem]);
                                                            setShowItemPicker(false);
                                                            setPickerOpenSection(null);
                                                        }}
                                                        className="aspect-square bg-zinc-50 rounded-2xl p-2 border border-zinc-100 hover:border-black transition-all group overflow-hidden relative"
                                                    >
                                                        <img src={witem.image} className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-110" alt={witem.name} />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex flex-col items-center justify-center transition-all opacity-0 group-hover:opacity-100 rounded-2xl">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-lg">{t('outfit.add')}</span>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm py-1.5 px-2 text-[8px] font-bold text-white uppercase tracking-widest translate-y-full transition-transform group-hover:translate-y-0 rounded-b-xl">
                                                            {witem.name}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
