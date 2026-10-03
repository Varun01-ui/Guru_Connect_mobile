import { useSession } from '../../../lib/session.store';
import { useChildSwitcher } from '../hooks';

const login = (userId: string) => useSession.getState().setSession({ accessToken: 't', userId, role: 'parent', profileId: 'p' });

beforeEach(() => {
  useSession.getState().clear();
  useChildSwitcher.getState().select(null);
});

describe('selected child', () => {
  it('is forgotten when the user signs out', () => {
    login('u1');
    useChildSwitcher.getState().select('child-1');
    expect(useChildSwitcher.getState().selectedChildId).toBe('child-1');

    useSession.getState().clear();
    expect(useChildSwitcher.getState().selectedChildId).toBeNull();
  });

  it('is forgotten when a different account signs in', () => {
    login('u1');
    useChildSwitcher.getState().select('child-1');
    login('u2');
    expect(useChildSwitcher.getState().selectedChildId).toBeNull();
  });

  it('is kept when the same account just refreshes its token', () => {
    login('u1');
    useChildSwitcher.getState().select('child-1');
    login('u1');
    expect(useChildSwitcher.getState().selectedChildId).toBe('child-1');
  });
});
