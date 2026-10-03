import { api } from '../../lib/api';

export type RailCode = 'recommended_teachers' | 'recommended_institutes' | 'nearby_teachers' | 'top_rated_teachers' | 'verified_teachers';

export interface TeacherCardData {
  teacherId: string;
  publicCode?: string;
  fullName: string;
  photoUrl?: string | null;
  categoryName?: string | null;
  feePerHourPaise?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  trustScore?: number | null;
  isVerifiedBadge?: boolean;
  distanceLabel?: string | null;
  areaLabel?: string | null;
  score?: number;
}

export interface InstituteCardData {
  instituteId: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  overallRating?: number | null;
  userRatingAvg?: number | null;
  teacherCount?: number | null;
  isPremium?: boolean;
  score?: number;
}

export interface Rail<T> {
  items: T[];
  nextCursor: string | null;
  cachedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string | null;
  deepLink?: string | null;
}

export interface HomeChild {
  id: string;
  childName: string;
  classLabel: string;
  sortOrder: number;
}

export interface ParentHome {
  children: HomeChild[];
  selectedChildId: string | null;
  banners: { home_top: Banner[]; home_middle: Banner[] };
  rails: {
    recommended_teachers: Rail<TeacherCardData> | null;
    recommended_institutes: Rail<InstituteCardData> | null;
    nearby_teachers: Rail<TeacherCardData> | null;
    top_rated_teachers: Rail<TeacherCardData> | null;
    verified_teachers: Rail<TeacherCardData> | null;
  };
}

export function fetchParentHome(childId?: string | null) {
  return api.get<ParentHome>('home/parent', { searchParams: { childId: childId ?? undefined } });
}

export interface RailPage<T> {
  items: T[];
  nextCursor: string | null;
}

// One rail's next page ("See all"). The cursor comes back in the envelope's meta.
export async function fetchRailPage<T>(rail: RailCode, childId: string | undefined, cursor: string | undefined): Promise<RailPage<T>> {
  const res = await api.getWithMeta<T[] | { items: T[] }, { nextCursor?: string | null }>('home/parent', {
    searchParams: { rail, childId, cursor, limit: '20' },
  });
  const items = Array.isArray(res.data) ? res.data : res.data.items;
  return { items, nextCursor: res.meta.nextCursor ?? null };
}
