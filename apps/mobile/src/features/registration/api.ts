import { api } from '../../lib/api';

export interface RegistrationContext {
  contactType: 'phone' | 'email' | 'google';
  verifiedValue: string;
  prefill: { fullName?: string; photoUrl?: string } | null;
  roles: { code: string; title: string; subtitle: string }[];
  legal: { termsVersion: string; termsUrl: string; privacyVersion: string; privacyUrl: string };
}

export function fetchRegistrationContext(registrationToken: string) {
  return api.get<RegistrationContext>('registration/context', { token: registrationToken });
}

export type ReferralValidation =
  | { valid: true; programCode: string; ownerFirstName?: string }
  | { valid: false; reason: 'invalid' | 'expired' | 'limit_reached' | 'disabled' };

export function validateReferral(registrationToken: string, code: string) {
  return api.post<ReferralValidation>('registration/referral/validate', { code }, { token: registrationToken });
}

export interface RegisterParentBody {
  fullName: string;
  mobile: string;
  email?: string;
  stateId: string;
  cityId: string;
  areaId?: string;
  marketingOptIn: boolean;
  referralCode?: string;
}

export function registerParent(registrationToken: string, body: RegisterParentBody, idempotencyKey: string) {
  return api.post<any>('registration/parent', body, { token: registrationToken, idempotencyKey });
}
