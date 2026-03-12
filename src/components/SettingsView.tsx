
import { useState, useRef } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWardrobe } from '../hooks/useWardrobe';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { exportAllData, importAllData, clearAllData } from '../lib/wardrobeStorage';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { StorageHealth } from './StorageHealth';
import { calculateItemLimit, getPlanDetails, ITEM_PACKS, getPlanBadgeProps } from '../lib/pricing';
import type { PlanId } from '../lib/pricing';
import { PricingModal } from './PricingModal';

export function SettingsView() {
    const queryClient = useQueryClient();
    const { profile, update } = useUserProfile();
    const { wardrobe } = useWardrobe();
    const { isInstallable, installApp } = usePWAInstall();
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const itemLimit = calculateItemLimit(profile.subscription, profile.itemPacks);
    const currentPlanId: PlanId = profile.subscription?.planId || 'free';
    const currentPlan = getPlanDetails(currentPlanId);

    const handleUpgrade = async (planId: PlanId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Por favor inicia sesión para realizar la compra.');
            return;
        }
        
        const plan = getPlanDetails(planId);
        const checkoutUrl = `https://quemepongo.lemonsqueezy.com/checkout/buy/${plan.lemonSqueezyVariantId}?checkout[custom][user_id]=${user.id}`;
        window.open(checkoutUrl, '_blank');
    };

    const handleItemPackPurchase = async (packId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Por favor inicia sesión para realizar la compra.');
            return;
        }
        
        const pack = ITEM_PACKS[packId as keyof typeof ITEM_PACKS];
        const checkoutUrl = `https://quemepongo.lemonsqueezy.com/checkout/buy/${pack.lemonSqueezyVariantId}?checkout[custom][user_id]=${user.id}`;
        window.open(checkoutUrl, '_blank');
    };

    const handleReset = async () => {
        if (window.confirm('⚠️ ¿Estás COMPLETAMENTE seguro? Esto borrará todas tus prendas, planes y perfil permanentemente de la nube y este dispositivo.')) {
            try {
                await clearAllData();
                queryClient.clear();
                alert('Armario reiniciado correctamente. La página se recargará.');
                window.location.reload();
            } catch (err) {
                console.error('Error resetting:', err);
                alert('Error al reiniciar. Intenta de nuevo.');
            }
        }
    };

    const handleExport = async () => {
        const json = await exportAllData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        a.download = `que-me-pongo-backup-${dd}-${mm}-${yyyy}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                await importAllData(reader.result as string);
                setImportStatus('✅ Datos importados correctamente. Recarga la página para ver los cambios.');
            } catch {
                setImportStatus('❌ Error al importar. Verifica que el archivo sea válido.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="animate-fade">
            <div className="mb-16">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Ajustes</h2>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">
                    Personaliza tu experiencia
                </p>
            </div>

            {/* User Profile */}
            <div className="bg-zinc-50 rounded-[3rem] p-10 border border-zinc-100 mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Perfil de Usuario</h3>
                <p className="text-[10px] text-zinc-400 mb-8">Todos los campos son opcionales.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Nombre</label>
                        <input
                            type="text"
                            value={profile.name || ''}
                            onChange={e => update({ name: e.target.value || undefined })}
                            placeholder="Tu nombre"
                            className="bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                    </div>

                    {/* Sex */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Sexo</label>
                        <div className="flex gap-3">
                            {['Masculino', 'Femenino', 'Otro'].map(option => (
                                <button
                                    key={option}
                                    onClick={() => update({ sex: profile.sex === option ? undefined : option })}
                                    className={`flex-1 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${profile.sex === option
                                        ? 'bg-black text-white shadow-lg scale-105'
                                        : 'bg-white border border-zinc-200 text-zinc-400 hover:bg-zinc-100'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Edad</label>
                        <input
                            type="number"
                            value={profile.age ?? ''}
                            onChange={e => update({ age: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Años"
                            min="1"
                            max="120"
                            className="bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                    </div>

                    {/* Weight */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Peso (kg)</label>
                        <input
                            type="number"
                            value={profile.weight ?? ''}
                            onChange={e => update({ weight: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="kg"
                            min="1"
                            className="bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                    </div>

                    {/* Height */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Estatura (cm)</label>
                        <input
                            type="number"
                            value={profile.height ?? ''}
                            onChange={e => update({ height: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="cm"
                            min="1"
                            className="bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Plan & Storage */}
            <div className="bg-zinc-50 rounded-[3rem] p-10 border border-zinc-100 mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8">
                    <i className={`fas ${currentPlanId === 'free' ? 'fa-seedling text-zinc-300' : currentPlanId === 'pro' ? 'fa-gem text-amber-500' : 'fa-crown text-purple-500'} text-4xl opacity-20`}></i>
                </div>

                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Plan y Almacenamiento</h3>

                {/* Current Plan Display */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black uppercase tracking-tighter">
                                {currentPlan.name}
                            </span>
                            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${getPlanBadgeProps(currentPlanId).className}`}>
                                <i className={`fas ${getPlanBadgeProps(currentPlanId).icon} mr-1`}></i>
                                {getPlanBadgeProps(currentPlanId).label}
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            {wardrobe.length} de {itemLimit >= 999999 ? '∞' : itemLimit} prendas utilizadas
                        </p>
                    </div>

                    {currentPlanId === 'free' ? (
                        <button
                            className="bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                            onClick={() => setShowPricingModal(true)}
                        >
                            Ver Planes
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="bg-zinc-100 px-6 py-4 rounded-full text-zinc-400 font-black text-[10px] uppercase tracking-widest">
                                {currentPlanId === 'pro' ? 'Plan Pro Activo' : 'Plan Ilimitado'}
                            </div>
                            {currentPlanId === 'pro' && (
                                <button
                                    onClick={() => handleUpgrade('unlimited')}
                                    className="bg-purple-600 text-white px-6 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Mejorar a Ilimitado
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="mb-10">
                    <StorageHealth current={wardrobe.length} limit={itemLimit} isPro={currentPlanId !== 'free'} />
                </div>

                {/* Item Packs Section */}
                {currentPlanId !== 'free' && (
                    <div className="border-t border-zinc-200 pt-8">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
                            ¿Necesitas más espacio? Compra packs adicionales
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.values(ITEM_PACKS).map(pack => (
                                <button
                                    key={pack.id}
                                    onClick={() => handleItemPackPurchase(pack.id)}
                                    className="bg-white border-2 border-zinc-200 rounded-2xl p-6 text-left hover:border-black hover:scale-105 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-black text-zinc-600">
                                            {pack.name}
                                        </span>
                                        <i className="fas fa-plus-circle text-zinc-300 group-hover:text-black"></i>
                                    </div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                                        {pack.description}
                                    </p>
                                    <p className="text-lg font-black text-black">
                                        ${pack.price} <span className="text-[8px] font-bold text-zinc-400">MXN</span>
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Export / Import */}
            <div className="bg-zinc-50 rounded-[3rem] p-10 border border-zinc-100 mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Datos</h3>
                <p className="text-[10px] text-zinc-400 mb-8">
                    Exporta todas tus prendas, planes y perfil en un archivo JSON. Impórtalo en otro dispositivo o como respaldo.
                </p>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleExport}
                        className="bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Exportar Datos
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border-2 border-black text-black px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Importar Datos
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-red-50 text-red-500 border border-red-100 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all ml-auto"
                    >
                        Reiniciar Armario
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                </div>

                {importStatus && (
                    <p className="mt-6 text-sm font-medium">{importStatus}</p>
                )}
            </div>

            {/* PWA Install */}
            <div className="bg-zinc-50 rounded-[3rem] p-10 border border-zinc-100">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Aplicación</h3>
                <p className="text-[10px] text-zinc-400 mb-8">
                    Instala "¿Qué me pongo?" en tu dispositivo para un acceso rápido y una experiencia de pantalla completa.
                </p>

                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-xl">
                        <img src={`${import.meta.env.BASE_URL}icon-192.svg`} className="w-12 h-12" alt="App Icon" />
                    </div>
                    {isInstallable ? (
                        <button
                            onClick={installApp}
                            className="bg-black text-white px-12 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                        >
                            Instalar App
                        </button>
                    ) : (
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {window.matchMedia('(display-mode: standalone)').matches
                                ? 'Ya estás usando la versión instalada'
                                : 'Tu navegador ya tiene la app o no soporta instalación automática'}
                        </p>
                    )}
                </div>
            </div>

            {/* Pricing Modal */}
            {showPricingModal && (
                <PricingModal 
                    onClose={() => setShowPricingModal(false)}
                    currentPlanId={currentPlanId}
                />
            )}
        </div>
    );
}
