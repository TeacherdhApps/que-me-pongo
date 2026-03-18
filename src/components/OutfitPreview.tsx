import { useState, useRef } from 'react';
import type { ClothingItem } from '../types';
import { Categories } from '../types';

interface OutfitPreviewProps {
    items: ClothingItem[];
    onClose: () => void;
    dayName: string;
    dateDisplay: string;
}

interface DraggableItemProps {
    item?: ClothingItem;
    label: string;
    initialPos: { x: number; y: number };
    zIndex: number;
    bringToFront: () => void;
}

const DraggableItem = ({ item, label, initialPos, zIndex, bringToFront }: DraggableItemProps) => {
    const [pos, setPos] = useState(initialPos);
    const [size, setSize] = useState({ w: 140, h: 140 });
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
        posStart.current = { x: pos.x, y: pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setPos({ x: posStart.current.x + dx, y: posStart.current.y + dy });
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
        sizeStart.current = { w: size.w, h: size.h };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleResizePointerMove = (e: React.PointerEvent) => {
        if (!isResizing) return;
        e.stopPropagation();
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        // We scale uniformly to keep the items from getting distorted
        const delta = Math.max(dx, dy); 
        const newSize = Math.max(70, Math.min(300, sizeStart.current.w + delta));
        setSize({ w: newSize, h: newSize });
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
                top: `${pos.y}px`,
                left: `${pos.x}px`,
                width: `${size.w}px`,
                height: `${size.h}px`,
                zIndex: isDragging || isResizing ? 999 : zIndex,
                position: 'absolute',
                touchAction: 'none'
            }}
            className={`bg-white rounded-3xl p-3 flex flex-col items-center justify-center shadow-xl cursor-grab active:cursor-grabbing transition-shadow ${isDragging || isResizing ? 'shadow-2xl ring-4 ring-black/10' : 'border border-zinc-100 hover:shadow-2xl'}`}
        >
            {item ? (
                <div className="w-full h-full flex flex-col items-center gap-2 pointer-events-none relative">
                    <img src={item.image} className="w-full h-[calc(100%-1.25rem)] object-cover rounded-2xl shadow-sm bg-zinc-50" alt={item.name} draggable="false" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center truncate w-full absolute bottom-0">{item.name}</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 opacity-30 pointer-events-none w-full h-full justify-center">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center border-2 border-dashed border-zinc-300">
                        <i className={`fas ${label === Categories.OUTERWEAR ? 'fa-vest' : label === Categories.TOP ? 'fa-shirt' : label === Categories.BOTTOM ? 'fa-socks' : 'fa-shoe-prints'} text-zinc-400`}></i>
                    </div>
                </div>
            )}
            
            <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center cursor-nwse-resize hover:bg-zinc-100 bg-white rounded-full text-zinc-300 border border-zinc-200 hover:text-black shadow-sm transition-colors z-[100]"
                title="Redimensionar"
                style={{ touchAction: 'none' }}
            >
                <i className="fas fa-expand-alt text-[10px] transform rotate-90"></i>
            </div>
        </div>
    );
};

export function OutfitPreview({ items, onClose, dayName, dateDisplay }: OutfitPreviewProps) {
    const outerwear = items.find(itm => itm.category === Categories.OUTERWEAR);
    const superior = items.find(itm => itm.category === Categories.TOP);
    const inferior = items.find(itm => itm.category === Categories.BOTTOM);
    const calzado = items.find(itm => itm.category === Categories.SHOES);

    const [zIndices, setZIndices] = useState({
        [Categories.OUTERWEAR]: 4,
        [Categories.TOP]: 3,
        [Categories.BOTTOM]: 2,
        [Categories.SHOES]: 1,
    });
    const [maxZ, setMaxZ] = useState(5);

    const bringToFront = (label: string) => {
        setMaxZ(prev => prev + 1);
        setZIndices(prev => ({ ...prev, [label]: maxZ + 1 }));
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-6 md:p-10 w-full max-w-3xl flex flex-col items-center overflow-hidden">
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Crea tu Look</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Arrastra las prendas libremente · {dayName} {dateDisplay}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                        <i className="fas fa-times text-zinc-500"></i>
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="relative w-full h-[350px] md:h-[450px] bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 overflow-hidden mb-8 shadow-inner" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    <DraggableItem item={outerwear} label={Categories.OUTERWEAR} initialPos={{ x: 20, y: 20 }} zIndex={zIndices[Categories.OUTERWEAR]} bringToFront={() => bringToFront(Categories.OUTERWEAR)} />
                    <DraggableItem item={superior} label={Categories.TOP} initialPos={{ x: 160, y: 40 }} zIndex={zIndices[Categories.TOP]} bringToFront={() => bringToFront(Categories.TOP)} />
                    <DraggableItem item={inferior} label={Categories.BOTTOM} initialPos={{ x: 60, y: 180 }} zIndex={zIndices[Categories.BOTTOM]} bringToFront={() => bringToFront(Categories.BOTTOM)} />
                    <DraggableItem item={calzado} label={Categories.SHOES} initialPos={{ x: 200, y: 200 }} zIndex={zIndices[Categories.SHOES]} bringToFront={() => bringToFront(Categories.SHOES)} />
                    
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2 rounded-full border border-zinc-200 shadow-sm pointer-events-none">
                            <i className="fas fa-hand-pointer text-[10px] text-zinc-400"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Lienzo Libre</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full md:max-w-xs py-5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                    Listo
                </button>
            </div>
        </div>
    );
}
