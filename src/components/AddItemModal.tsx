
import { useState, useRef, useCallback } from 'react';
import { Categories, type Category, type ClothingItem } from '../types';
import { resizeImage } from '../lib/imageResizer';
import { uploadImage } from '../lib/wardrobeStorage';
import { supabase } from '../lib/supabase';
import { ImageUploadProgress } from './ui/LoadingStates';
import { FREE_ITEM_LIMIT } from '../lib/pricing';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

// Map category values to translation keys
const categoryTranslationKeys: Record<string, TranslationKey> = {
    [Categories.OUTERWEAR]: 'category.outerwear',
    [Categories.TOP]: 'category.top',
    [Categories.BOTTOM]: 'category.bottom',
    [Categories.SHOES]: 'category.shoes',
};

interface AddItemModalProps {
    onClose: () => void;
    onAdd: (item: Omit<ClothingItem, 'id'>) => Promise<ClothingItem>;
    currentCount: number;
}

export function AddItemModal({ onClose, onAdd, currentCount }: AddItemModalProps) {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>(Categories.TOP);
    const [image, setImage] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    const itemLimit = FREE_ITEM_LIMIT;
    const isOverLimit = currentCount >= itemLimit;

    const handleFile = async (file: File) => {
        if (isOverLimit) {
            const remainingItems = itemLimit - currentCount;
            const message = remainingItems <= 0 
                ? t('addItem.limitAlertUpgrade') 
                : t('addItem.limitAlertRemaining', { remaining: String(remainingItems) });
            alert(t('addItem.limitAlert', { current: String(currentCount), limit: String(itemLimit), message }));
            return;
        }
        setIsProcessing(true);
        try {
            const objectUrl = URL.createObjectURL(file);
            const compressed = await resizeImage(objectUrl, 800, 800, 0.7);
            URL.revokeObjectURL(objectUrl);
            setImage(compressed);
        } catch (err) {
            console.error('Error processing image:', err);
            alert(t('addItem.imageError'));
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
    }, [isOverLimit]);

    const [isUploading, setIsUploading] = useState(false);

    const submit = async () => {
        if (!name || !image) return;
        if (isOverLimit) {
            alert(t('addItem.limitAlertNoAdd'));
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        try {
            let finalImage = image;
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                finalImage = await uploadImage(image, user.id, setUploadProgress);
            }

            await onAdd({
                name,
                category,
                image: finalImage,
                color: '',
                tags: []
            });
            onClose();
        } catch (err: any) {
            console.error('Submit error:', err);
            alert(t('addItem.saveError'));
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl animate-fade">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-10 w-full max-w-lg space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{t('addItem.title')}</h3>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                        <i className="fas fa-times text-zinc-400"></i>
                    </button>
                </div>

                {/* Storage Indicator */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                            {t('addItem.freePlan')}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isOverLimit ? 'text-red-500' : 'text-zinc-400'}`}>
                            {currentCount} / {itemLimit} {t('addItem.garments')}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all rounded-full ${isOverLimit ? 'bg-red-500' : 'bg-black'}`}
                            style={{ width: `${Math.min(100, (currentCount / itemLimit) * 100)}%` }}
                        />
                    </div>
                    {isOverLimit && (
                        <p className="text-[7px] font-bold text-red-500 uppercase tracking-widest mt-2">
                            {t('addItem.limitReached')}
                        </p>
                    )}
                </div>

                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`
            aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
            ${isDragging ? 'border-black bg-zinc-50 scale-105' : 'border-zinc-200 bg-zinc-50/50'}
            ${image && !isProcessing ? 'border-none cursor-pointer' : ''}
          `}
                    onClick={() => image && !isProcessing && fileRef.current?.click()}
                >
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-3">
                            <i className="fas fa-circle-notch fa-spin text-2xl text-zinc-300"></i>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('addItem.processing')}</p>
                        </div>
                    ) : image ? (
                        <div className="relative w-full h-full group">
                            <img src={image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-bold text-xs uppercase tracking-widest">{t('addItem.changePhoto')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 p-8 w-full">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <i className="fas fa-image text-2xl text-zinc-300"></i>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {t('addItem.dragHere')}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                                    className="px-5 py-3 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                                >
                                    <i className="fas fa-folder-open"></i> {t('addItem.browse')}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                                    className="px-5 py-3 bg-white border-2 border-black text-black rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                                >
                                    <i className="fas fa-camera"></i> {t('addItem.takePhoto')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>



                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => {
                    if (e.target.files?.[0]) {
                        handleFile(e.target.files[0]);
                        e.target.value = '';
                    }
                }} />
                <input type="file" ref={cameraRef} className="hidden" accept="image/*" capture="environment" onChange={e => {
                    if (e.target.files?.[0]) {
                        handleFile(e.target.files[0]);
                        e.target.value = '';
                    }
                }} />

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('addItem.name')}</label>
                        <input
                            type="text"
                            placeholder={t('addItem.namePlaceholder')}
                            className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('addItem.category')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(Categories).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => setCategory(value as Category)}
                                    className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${category === value ? 'bg-black text-white shadow-lg scale-105' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                        }`}
                                >
                                    {t(categoryTranslationKeys[value])}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={submit}
                    disabled={!name || !image || isProcessing || isUploading}
                    className="w-full py-5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? t('addItem.processing') : isUploading ? t('addItem.uploading') : t('addItem.save')}
                </button>
            </div>
        </div>
        {isUploading && <ImageUploadProgress isUploading={isUploading} progress={uploadProgress} />}
        </>
    );
}
