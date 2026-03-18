import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPWAEvent);
    const [isInstallable, setIsInstallable] = useState(!!(window as any).deferredPWAEvent);

    useEffect(() => {
        // If we missed the global event, listen here too
        const handler = (e: any) => {
            console.log('✅ Local hook: beforeinstallprompt fired!');
            (window as any).deferredPWAEvent = e;
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Periodically check the global variable (in case it updated before this hook mounted)
        const checkGlobal = setInterval(() => {
            if ((window as any).deferredPWAEvent && !deferredPrompt) {
                console.log('🔗 Connecting hook to global PWA event');
                setDeferredPrompt((window as any).deferredPWAEvent);
                setIsInstallable(true);
            }
        }, 1000);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            (window as any).navigator.standalone) {
            console.log('📱 App is already in standalone mode');
            setIsInstallable(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearInterval(checkGlobal);
        };
    }, [deferredPrompt]);

    const install = async () => {
        const promptToUse = deferredPrompt || (window as any).deferredPWAEvent;
        if (!promptToUse) {
            console.warn('❌ Attempted install but no prompt found');
            return;
        }

        // Show the prompt
        promptToUse.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await promptToUse.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        (window as any).deferredPWAEvent = null;
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, installApp: install };
}
