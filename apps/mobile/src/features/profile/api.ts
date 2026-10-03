import { api } from '../../lib/api';

export interface ParentProfile {
  id: string;
  publicCode: string;
  fullName: string;
  photoUrl?: string | null;
  phoneMasked: string;
  emailMasked?: string | null;
  city: { id: string; name: string } | null;
  area: { id: string; name: string } | null;
  childrenCount: number;
  unreadNotifications: number;
  memberSince: string;
  updatedAt: string;
}

export interface ProfileInput {
  fullName: string;
  cityId: string;
  areaId: string | null;
  // File id of a completed avatar upload, or null to go back to the initials avatar.
  profilePhotoFileId: string | null;
}

export function fetchProfile() {
  return api.get<ParentProfile>('parent/profile');
}

export function updateProfile(input: Partial<ProfileInput>, updatedAt: string) {
  return api.patch<Pick<ParentProfile, 'id' | 'fullName' | 'photoUrl' | 'city' | 'area' | 'updatedAt'>>('parent/profile', input, { ifMatch: updatedAt });
}
