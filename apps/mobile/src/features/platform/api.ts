import { api } from '../../lib/api';

export interface BootstrapResponse {
  serverTime: string;
  app: { minVersion: string; latestVersion: string; updateRequired: boolean; updateAvailable: boolean; updateMessage: string; storeUrl: string };
  maintenance: { enabled: boolean; message: string | null; endsAt: string | null };
  onboardingVersion: number;
  auth: { phoneOtp: true; email: boolean; google: boolean; otpResendAfterSeconds: number };
  support: { email: string; phone: string; whatsapp: string };
  legal: { termsUrl: string; privacyUrl: string; refundUrl: string };
  limits: { parentMaxChildren: number; reviewMinChars: number; studentMinAgeWithoutConsent: number };
  features: Record<string, boolean>;
  mastersVersion: string;
}

export function fetchBootstrap() {
  return api.get<BootstrapResponse>('bootstrap');
}

export interface MeResponse {
  userId: string;
  role: 'parent' | 'student' | 'teacher' | 'institute_staff';
  profileId: string | null;
  name: string;
  accountStatus: string;
  registration: { complete: boolean; nextStep: string | null };
}

export function fetchMe() {
  return api.get<MeResponse>('me');
}

export interface MastersResponse {
  states: { id: string; name: string; code: string }[];
  cities: { id: string; stateId: string; name: string }[];
  // levelOrder: position of the class in the school ladder, used to decide which subjects apply.
  classes: { id: string; name: string; levelOrder?: number }[];
  // A subject applies to a class when min/maxClassOrder (either may be null = open) bracket the class's levelOrder.
  subjects?: { id: string; name: string; minClassOrder: number | null; maxClassOrder: number | null }[];
  // stateId is set for state boards; type is national | international | state | university | other.
  boards: { id: string; name: string; shortName?: string; type?: string; stateId?: string | null }[];
  teacherCategories?: { id: string; name: string }[];
  teachingModes: { id: string; name: string }[];
}

export function fetchMasters() {
  return api.get<MastersResponse>('masters');
}

export function fetchAreas(cityId: string) {
  return api.get<{ areas: { id: string; cityId: string; name: string }[] }>('masters/areas', { searchParams: { cityId } });
}

export function registerDevice(input: {
  installId: string;
  platform: 'android' | 'ios';
  appVersion: string;
  locale?: string;
  timezone?: string;
}) {
  return api.put<{ ok: boolean }>('devices/me', input);
}
