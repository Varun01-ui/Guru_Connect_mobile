import { useMutation } from '@tanstack/react-query';
import { persistRefreshToken } from '../../lib/api';
import { useSession } from '../../lib/session.store';
import * as api from './api';
import type { SessionResult } from './api';

export async function applySession(result: SessionResult) {
  useSession.getState().setSession({ accessToken: result.accessToken, userId: result.user.userId, role: result.user.role, profileId: null });
  await persistRefreshToken(result.refreshToken);
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: api.requestOtp });
}

export function useVerifyOtpMutation() {
  return useMutation({ mutationFn: api.verifyOtp });
}

export function useEmailLoginMutation() {
  return useMutation({ mutationFn: api.emailLogin });
}

export function useEmailOtpRequestMutation() {
  return useMutation({ mutationFn: api.emailOtpRequest });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: api.forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: api.resetPassword });
}

export function useGoogleSignInMutation() {
  return useMutation({ mutationFn: api.googleSignIn });
}
