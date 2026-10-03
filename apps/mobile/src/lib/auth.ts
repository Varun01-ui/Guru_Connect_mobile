import { api, clearRefreshToken } from './api';
import { queryClient } from './queryClient';
import { useSession } from './session.store';

// Ends the session on the server (best effort), then wipes everything local
// that belongs to the signed-in user.
export async function signOut(): Promise<void> {
  await api.post('auth/logout').catch(() => {});
  await clearRefreshToken();
  useSession.getState().clear();
  queryClient.clear();
}
