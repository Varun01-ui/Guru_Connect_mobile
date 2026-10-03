import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformKeys } from '../platform/hooks';
import * as api from './api';

export const profileKeys = { me: ['profile', 'parent'] as const };

export function useProfileQuery(enabled = true) {
  return useQuery({ queryKey: profileKeys.me, queryFn: api.fetchProfile, enabled });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, updatedAt }: { input: Partial<api.ProfileInput>; updatedAt: string }) => api.updateProfile(input, updatedAt),
    onSuccess: () => {
      // A new city/area changes what Nearby, Top Rated and Verified show, so drop the dashboard cache too.
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: platformKeys.me });
    },
  });
}
