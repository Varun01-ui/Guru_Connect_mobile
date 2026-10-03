import type { BootstrapResponse } from '../platform/api';

export type SplashRoute = 'Maintenance' | 'ForceUpdate' | 'Onboarding' | 'Login' | 'Home';

export function decideSplashRoute(bootstrap: BootstrapResponse, hasRefreshToken: boolean, onboardingSeenVersion: number): SplashRoute {
  if (bootstrap.maintenance.enabled) return 'Maintenance';
  if (bootstrap.app.updateRequired) return 'ForceUpdate';
  if (hasRefreshToken) return 'Home';
  if (onboardingSeenVersion < (bootstrap.onboardingVersion || 1)) return 'Onboarding';
  return 'Login';
}
