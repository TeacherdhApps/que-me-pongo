import { useEffect, useState } from 'react';
import type { DailyOutfit } from '../types';

const STORAGE_KEY = 'que-me-pongo:copied-outfit';
const CHANGE_EVENT = 'outfit-clipboard-changed';

let cachedOutfit: DailyOutfit | null | undefined;

function readCopiedOutfit(): DailyOutfit | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as DailyOutfit) : null;
    } catch {
        return null;
    }
}

export function copyOutfit(outfit: DailyOutfit): void {
    cachedOutfit = outfit;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit));
    } catch (err) {
        console.warn('Could not persist copied outfit, keeping it for this session.', err);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getCopiedOutfit(): DailyOutfit | null {
    if (cachedOutfit === undefined) {
        cachedOutfit = readCopiedOutfit();
    }
    return cachedOutfit;
}

export function subscribeToCopiedOutfit(callback: () => void): () => void {
    const localHandler = () => {
        callback();
    };
    const storageHandler = () => {
        cachedOutfit = undefined;
        callback();
    };
    window.addEventListener(CHANGE_EVENT, localHandler);
    window.addEventListener('storage', storageHandler);
    return () => {
        window.removeEventListener(CHANGE_EVENT, localHandler);
        window.removeEventListener('storage', storageHandler);
    };
}

export function useCopiedOutfit(): DailyOutfit | null {
    const [outfit, setOutfit] = useState<DailyOutfit | null>(() => getCopiedOutfit());

    useEffect(() => {
        return subscribeToCopiedOutfit(() => setOutfit(getCopiedOutfit()));
    }, []);

    return outfit;
}
