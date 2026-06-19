import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { getProfile, type UserProfile } from '@/features/profile/api/profileClient';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useProfileQuery() {
  const { isAuthenticated } = useAuthContext();
  return useQuery<UserProfile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useProfileQueryClient() {
  return useQueryClient();
}
