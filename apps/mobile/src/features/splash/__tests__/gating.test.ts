import { decideSplashRoute } from '../gating';
import type { BootstrapResponse } from '../../platform/api';

const base: BootstrapResponse = {
  serverTime: '2026-01-01T00:00:00.000Z',
  app: { minVersion: '1.0.0', latestVersion: '1.0.0', updateRequired: false, updateAvailable: false, updateMessage: '', storeUrl: '' },
  maintenance: { enabled: false, message: null, endsAt: null },
  onboardingVersion: 2,
  auth: { phoneOtp: true, email: true, google: true, otpResendAfterSeconds: 30 },
  support: { email: '', phone: '', whatsapp: '' },
  legal: { termsUrl: '', privacyUrl: '', refundUrl: '' },
  limits: { parentMaxChildren: 3, reviewMinChars: 30, studentMinAgeWithoutConsent: 18 },
  features: {},
  mastersVersion: '1',
};

describe('decideSplashRoute', () => {
  it('routes to Maintenance when maintenance is enabled', () => {
    expect(decideSplashRoute({ ...base, maintenance: { ...base.maintenance, enabled: true } }, false, 0)).toBe('Maintenance');
  });

  it('routes to ForceUpdate when the app is below minVersion', () => {
    expect(decideSplashRoute({ ...base, app: { ...base.app, updateRequired: true } }, false, 0)).toBe('ForceUpdate');
  });

  it('routes to Onboarding when signed out and onboarding not yet seen at this version', () => {
    expect(decideSplashRoute(base, false, 1)).toBe('Onboarding');
  });

  it('routes to Login when signed out and onboarding already seen at this version', () => {
    expect(decideSplashRoute(base, false, 2)).toBe('Login');
  });

  it('routes to Home when a refresh token exists, bypassing onboarding regardless of version', () => {
    expect(decideSplashRoute(base, true, 0)).toBe('Home');
  });
});
