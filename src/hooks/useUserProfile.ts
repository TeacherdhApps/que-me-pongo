import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadUserProfile, saveUserProfile } from '../lib/wardrobeStorage';
import type { UserProfile } from '../types';

export function useUserProfile() {
    const queryClient = useQueryClient();

    const { data: profile = {}, isLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: loadUserProfile,
    });

    const updateMutation = useMutation({
        mutationFn: (updates: Partial<UserProfile>) => {
            const next = { ...profile, ...updates };
            return saveUserProfile(next);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
    });

    return { 
        profile, 
        isLoading, 
        updateProfile: updateMutation.mutateAsync 
    };
}
