import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from './api';

export const platformKeys = {
  bootstrap: ['bootstrap'] as const,
  me: ['me'] as const,
  masters: ['masters'] as const,
  areas: (cityId: string) => ['masters', 'areas', cityId] as const,
};

export function useBootstrapQuery() {
  return useQuery({ queryKey: platformKeys.bootstrap, queryFn: api.fetchBootstrap, staleTime: 60_000 });
}

export function useMeQuery(enabled: boolean) {
  return useQuery({ queryKey: platformKeys.me, queryFn: api.fetchMe, enabled });
}

export function useMastersQuery() {
  return useQuery({ queryKey: platformKeys.masters, queryFn: api.fetchMasters, staleTime: 5 * 60 * 1000 });
}

export function useAreasQuery(cityId: string | undefined) {
  return useQuery({ queryKey: platformKeys.areas(cityId ?? ''), queryFn: () => api.fetchAreas(cityId!), enabled: !!cityId });
}

export function useRegisterDeviceMutation() {
  return useMutation({ mutationFn: api.registerDevice });
}
