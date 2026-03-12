
import type { ClothingItem } from '../types';
import { Categories } from '../types';

interface OutfitPreviewProps {
    items: ClothingItem[];
    onClose: () => void;
    dayName: string;
    dateDisplay: string;
}

export function OutfitPreview({ items, onClose, dayName, dateDisplay }: OutfitPreviewProps) {
    const outerwear = items.find(itm => itm.category === Categories.OUTERWEAR);
    const superior = items.find(itm => itm.category === Categories.TOP);
    const inferior = items.find(itm => itm.category === Categories.BOTTOM);
    const calzado = items.find(itm => itm.category === Categories.SHOES);

    const GridItem = ({ item, label }: { item?: ClothingItem, label: string }) => (
        <div className="bg-zinc-50 rounded-3xl p-4 flex flex-col items-center justify-center border border-zinc-100 aspect-square">
            {item ? (
                <div className="w-full h-full flex flex-col items-center gap-2">
                    <img src={item.image} className="w-full h-full object-cover rounded-2xl shadow-sm" alt={item.name} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center truncate w-full">{item.name}</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-dashed border-zinc-300">
                        <i className={`fas ${label === Categories.OUTERWEAR ? 'fa-vest' : label === Categories.TOP ? 'fa-shirt' : label === Categories.BOTTOM ? 'fa-socks' : 'fa-shoe-prints'}`}></i>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">{label}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-10 w-full max-w-lg space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Vista de Outfit</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{dayName} • {dateDisplay}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                        <i className="fas fa-times text-zinc-400"></i>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <GridItem item={outerwear} label={Categories.OUTERWEAR} />
                        <GridItem item={superior} label={Categories.TOP} />
                    </div>
                    <div className="space-y-4">
                        <GridItem item={inferior} label={Categories.BOTTOM} />
                        <GridItem item={calzado} label={Categories.SHOES} />
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
