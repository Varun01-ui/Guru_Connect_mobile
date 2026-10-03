import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as api from './api';
import type { RailCode } from './api';

export const homeKeys = {
  parent: (childId?: string | null) => ['home', 'parent', childId ?? 'default'] as const,
  rail: (rail: RailCode, childId?: string) => ['home', 'rail', rail, childId ?? 'none'] as const,
};

export function useParentHome(childId?: string | null) {
  return useQuery({
    queryKey: homeKeys.parent(childId),
    queryFn: () => api.fetchParentHome(childId),
    placeholderData: keepPreviousData,
  });
}

export function useRail<T>(rail: RailCode, childId?: string) {
  return useInfiniteQuery({
    queryKey: homeKeys.rail(rail, childId),
    queryFn: ({ pageParam }) => api.fetchRailPage<T>(rail, childId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
