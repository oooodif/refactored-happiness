import { useQuery } from '@tanstack/react-query';

export interface AnonymousStatus {
  isAnonymous: boolean;
  hasRemainingUsage: boolean;
  noFingerprint?: boolean;
}

/**
 * Hook to check the status of an anonymous user
 * This will determine if the current user is anonymous and if they have any remaining free usage
 */
export function useAnonymousStatus() {
  return useQuery<AnonymousStatus>({
    queryKey: ['/api/anonymous/status'],
    // Don't retry since this is based on client-side fingerprint which won't change
    retry: false,
    // Cache for a while since anonymous status doesn't change often
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}