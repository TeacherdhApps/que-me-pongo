
import { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWardrobe, useWeeklyPlan } from '../hooks/useWardrobe';
import { useI18n } from '../i18n/I18nContext';

export function SettingsView() {
    const { profile, updateProfile, isLoading: profileLoading } = useUserProfile();
    const { wardrobe, resetWardrobe, bulkAdd } = useWardrobe();
    const { plan, bulkUpdatePlan } = useWeeklyPlan();
    const { t } = useI18n();
    const [name, setName] = useState(profile?.name || '');
    const [age, setAge] = useState(profile?.age || '');
    const [weight, setWeight] = useState(profile?.weight || '');
    const [height, setHeight] = useState(profile?.height || '');
    const [sex, setSex] = useState(profile?.sex || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                name,
                age: Number(age),
                weight: Number(weight),
                height: Number(height),
                sex
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm(t('settings.resetConfirm'))) {
            try {
                await resetWardrobe();
                alert(t('settings.resetSuccess'));
                window.location.reload();
            } catch (err) {
                alert(t('settings.resetError'));
            }
        }
    };

    const handleExport = () => {
        const data = {
            profile,
            wardrobe,
            plan,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qmp-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.wardrobe) await bulkAdd(data.wardrobe);
                if (data.plan) await bulkUpdatePlan(data.plan);
                if (data.profile) await updateProfile(data.profile);
                alert(t('settings.importSuccess'));
                window.location.reload();
            } catch (err) {
                console.error('Import error:', err);
                alert(t('settings.importError'));
            }
        };
        reader.readAsText(file);
    };

    // PWA Install Logic
    const [installEvent, setInstallEvent] = useState<any>(null);
    const [isInstalled] = useState(
        window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    );

    useState(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    });

    const handleInstall = async () => {
        const event = installEvent || (window as any).deferredPWAEvent;
        if (!event) return;
        event.prompt();
        const { outcome } = await event.userChoice;
        if (outcome === 'accepted') {
            setInstallEvent(null);
            (window as any).deferredPWAEvent = null;
        }
    };

    if (profileLoading) return null;

    return (
        <div className="max-w-2xl mx-auto pb-40 animate-fade">
            <div className="mb-16">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{t('settings.title')}</h2>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{t('settings.customize')}</p>
            </div>

            <div className="space-y-16">
                {/* Profile Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-xs">
                            <i className="fas fa-user"></i>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest">{t('settings.profile')}</h3>
                    </div>
                    
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 px-4 py-2 rounded-xl inline-block">
                        {t('settings.allOptional')}
                    </p>

                    <div className="grid gap-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('settings.name')}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t('settings.namePlaceholder')}
                                    className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-black transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('settings.sex')}</label>
                                <select
                                    value={sex}
                                    onChange={e => setSex(e.target.value)}
                                    className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-black appearance-none"
                                >
                                    <option value="">--</option>
                                    <option value="male">{t('settings.male')}</option>
                                    <option value="female">{t('settings.female')}</option>
                                    <option value="other">{t('settings.other')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('settings.age')}</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    placeholder={t('settings.agePlaceholder')}
                                    className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-black transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('settings.weight')}</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    placeholder={t('settings.weightPlaceholder')}
                                    className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-black transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-4">{t('settings.height')}</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    placeholder={t('settings.heightPlaceholder')}
                                    className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-black transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                        >
                            {isSaving ? t('addItem.processing') : t('addItem.save')}
                        </button>
                    </div>
                </section>

                <div className="h-px bg-zinc-100"></div>

                {/* Data Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 text-black rounded-full flex items-center justify-center text-xs">
                            <i className="fas fa-database"></i>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest">{t('settings.data')}</h3>
                    </div>

                    <p className="text-[10px] text-zinc-400 font-bold leading-relaxed uppercase tracking-widest">
                        {t('settings.dataDescription')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleExport}
                            className="flex-1 py-4 bg-zinc-100 text-black rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-file-export"></i> {t('settings.export')}
                        </button>
                        <label className="flex-1 py-4 bg-zinc-100 text-black rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <i className="fas fa-file-import"></i> {t('settings.import')}
                            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                        </label>
                        <button
                            onClick={handleReset}
                            className="flex-1 py-4 bg-red-50 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-trash-alt"></i> {t('settings.reset')}
                        </button>
                    </div>
                </section>

                <div className="h-px bg-zinc-100"></div>

                {/* App Installation Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 text-black rounded-full flex items-center justify-center text-xs">
                            <i className="fas fa-mobile-alt"></i>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest">{t('settings.app')}</h3>
                    </div>

                    <p className="text-[10px] text-zinc-400 font-bold leading-relaxed uppercase tracking-widest">
                        {t('settings.appDescription')}
                    </p>

                    <div>
                        {isInstalled ? (
                            <div className="bg-green-50 text-green-600 px-6 py-4 rounded-3xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3">
                                <i className="fas fa-check-circle"></i> {t('settings.alreadyInstalled')}
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                disabled={!installEvent && !(window as any).deferredPWAEvent}
                                className="w-full sm:w-auto px-8 py-5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-30 flex items-center justify-center gap-3"
                            >
                                <i className="fas fa-download"></i> {t('settings.install')}
                            </button>
                        )}
                        {!isInstalled && !installEvent && !(window as any).deferredPWAEvent && (
                            <p className="mt-4 text-[9px] text-zinc-300 font-bold uppercase tracking-widest italic leading-relaxed">
                                {t('settings.cantInstall')}
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
