
import { useState, useRef } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { exportAllData, importAllData } from '../lib/wardrobeStorage';

export function SettingsView() {
    const { profile, update } = useUserProfile();
    const { isInstallable, installApp } = usePWAInstall();
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const json = exportAllData();
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
        reader.onload = () => {
            try {
                importAllData(reader.result as string);
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
