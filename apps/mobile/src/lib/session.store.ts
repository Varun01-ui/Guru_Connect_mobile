import { create } from 'zustand';

export type Role = 'parent' | 'student' | 'teacher' | 'institute_staff';

interface SessionState {
  accessToken: string | null;
  userId: string | null;
  role: Role | null;
  profileId: string | null;
  setSession: (s: { accessToken: string; userId: string; role: Role; profileId: string | null }) => void;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  userId: null,
  role: null,
  profileId: null,
  setSession: (s) => set({ accessToken: s.accessToken, userId: s.userId, role: s.role, profileId: s.profileId }),
  clear: () => set({ accessToken: null, userId: null, role: null, profileId: null }),
}));
