
import { useState, useRef } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWardrobe } from '../hooks/useWardrobe';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { exportAllData, importAllData, clearAllData } from '../lib/wardrobeStorage';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function SettingsView() {
    const queryClient = useQueryClient();
    const { profile, update } = useUserProfile();
    const { wardrobe } = useWardrobe();
    const { isInstallable, installApp } = usePWAInstall();
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    <i className={`fas ${profile.isPro ? 'fa-gem text-amber-500' : 'fa-seedling text-zinc-300'} text-4xl opacity-20`}></i>
                </div>

                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Plan y Almacenamiento</h3>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black uppercase tracking-tighter">
                                {profile.isPro ? 'Plan Premium' : 'Plan Gratuito'}
                            </span>
                            {profile.isPro && (
                                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">PRO</span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            {wardrobe.length} de {profile.isPro ? '∞' : '100'} prendas utilizadas
                        </p>
                    </div>

                    {!profile.isPro ? (
                        <button
                            className="bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                            onClick={async () => {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) {
                                    alert('Por favor inicia sesión para realizar la compra.');
                                    return;
                                }
                                // Lemon Squeezy Checkout URL with custom user_id data
                                const LS_CHECKOUT_URL = `https://quemepongo.lemonsqueezy.com/checkout/buy/2131fda6-1821-42d0-a7a0-c9eac6dd29ae?checkout[custom][user_id]=${user.id}`;
                                window.open(LS_CHECKOUT_URL, '_blank');
                            }}
                        >
                            Pasar a Pro
                        </button>
                    ) : (
                        <div className="bg-zinc-100 px-6 py-4 rounded-full text-zinc-400 font-black text-[10px] uppercase tracking-widest">
                            Suscripción Activa
                        </div>
                    )}
                </div>

                <div className="mt-10 h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${profile.isPro ? 'bg-amber-500' : (wardrobe.length / 100 > 0.9 ? 'bg-red-500' : 'bg-black')}`}
                        style={{ width: profile.isPro ? '100%' : `${Math.min((wardrobe.length / 100) * 100, 100)}%` }}
                    ></div>
                </div>
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
        </div>
    );
}
