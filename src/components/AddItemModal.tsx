
import { useState, useRef, useCallback } from 'react';
import { Categories, type Category, type ClothingItem } from '../types';
import { resizeImage } from '../lib/imageResizer';

interface AddItemModalProps {
    onClose: () => void;
    onAdd: (item: Omit<ClothingItem, 'id'>) => void;
}

export function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>(Categories.TOP);
    const [image, setImage] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const reader = new FileReader();
            const rawBase64 = await new Promise<string>((resolve) => {
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.readAsDataURL(file);
            });

            // Resize and compress to 800px max, 70% quality
            const compressed = await resizeImage(rawBase64, 800, 800, 0.7);
            setImage(compressed);
        } catch (err) {
            console.error('Error processing image:', err);
            alert('Error al procesar la imagen. Intenta con otra.');
        } finally {
            setIsProcessing(false);
        }
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const submit = () => {
        if (!name || !image) return;
        onAdd({
            name,
            category,
            image,
            color: '',
            tags: []
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-10 w-full max-w-lg space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Nueva Pieza</h3>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                        <i className="fas fa-times text-zinc-400"></i>
                    </button>
                </div>

                <div
                    onClick={() => !isProcessing && fileRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`
            aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
            ${isDragging ? 'border-black bg-zinc-50 scale-105' : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'}
            ${image && !isProcessing ? 'border-none' : ''}
          `}
                >
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-3">
                            <i className="fas fa-circle-notch fa-spin text-2xl text-zinc-300"></i>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Procesando...</p>
                        </div>
                    ) : image ? (
                        <div className="relative w-full h-full group">
                            <img src={image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-bold text-xs uppercase tracking-widest">Cambiar foto</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 p-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <i className="fas fa-camera text-2xl text-zinc-300"></i>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Arrastra una imagen aquí</p>
                                <p className="text-[10px] text-zinc-400 mt-1">o haz click para buscar</p>
                            </div>
                        </div>
                    )}
                </div>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => {
                    if (e.target.files?.[0]) {
                        handleFile(e.target.files[0]);
                        // Reset input so the same file can be selected again if needed
                        e.target.value = '';
                    }
                }} />

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Nombre</label>
                        <input
                            type="text"
                            placeholder="Ej. Camisa Oxford"
                            className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Categoría</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(Categories).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => setCategory(value as Category)}
                                    className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${category === value ? 'bg-black text-white shadow-lg scale-105' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={submit}
                    disabled={!name || !image || isProcessing}
                    className="w-full py-5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Procesando...' : 'Guardar Pieza'}
                </button>
            </div>
        </div>
    );
}
