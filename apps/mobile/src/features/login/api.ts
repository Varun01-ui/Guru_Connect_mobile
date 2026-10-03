import { api } from '../../lib/api';

export interface OtpRequestResult {
  challengeId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}
export function requestOtp(phone: string) {
  return api.post<OtpRequestResult>('auth/otp/request', { phone });
}

export interface SessionResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  session: { id: string };
  user: { userId: string; role: 'parent' | 'student' | 'teacher' | 'institute_staff'; fullName: string; accountStatus: string };
}
export function verifyOtp(input: { challengeId: string; code: string; intendedRole?: string }) {
  return api.post<SessionResult>('auth/otp/verify', input);
}

export function emailLogin(input: { email: string; password: string }) {
  return api.post<SessionResult>('auth/email/login', input);
}

export function emailOtpRequest(email: string) {
  return api.post<OtpRequestResult>('auth/email/otp/request', { email });
}

export function forgotPassword(email: string) {
  return api.post<{ sent: boolean }>('auth/password/forgot', { email });
}

export function resetPassword(input: { challengeId: string; code: string; newPassword: string }) {
  return api.post<{ ok: boolean }>('auth/password/reset', input);
}

export function googleSignIn(input: { idToken: string; intendedRole?: string }) {
  return api.post<SessionResult>('auth/google', input);
}

export function fetchSessions() {
  return api.get<{ id: string; deviceLabel: string; isCurrent: boolean; lastUsedAt: string }[]>('auth/sessions');
}

export function revokeSession(id: string) {
  return api.delete<{ ok: boolean }>(`auth/sessions/${id}`);
}

export function logoutAll() {
  return api.post<{ ok: boolean }>('auth/logout-all');
}
