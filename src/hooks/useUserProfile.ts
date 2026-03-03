
import { useState, useCallback, useEffect } from 'react';
import { loadUserProfile, saveUserProfile } from '../lib/wardrobeStorage';
import type { UserProfile } from '../types';

export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserProfile().then(data => {
            setProfile(data);
            setIsLoading(false);
        });
    }, []);

    const update = useCallback(async (updates: Partial<UserProfile>) => {
        const next = { ...profile, ...updates };
        setProfile(next);
        await saveUserProfile(next);
    }, [profile]);

    return { profile, isLoading, update };
}
