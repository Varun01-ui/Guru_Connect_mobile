export type GoogleSignInResult = { idToken: string } | { cancelled: true } | { notConfigured: true };

let configured = false;

// The Google Sign-In native module is required lazily so the app still starts
// in Expo Go (where the module doesn't exist). There, or without a client id,
// this reports notConfigured and the UI shows a friendly message.
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return { notConfigured: true };

  let mod: typeof import('@react-native-google-signin/google-signin');
  try {
    mod = require('@react-native-google-signin/google-signin');
  } catch {
    return { notConfigured: true };
  }

  try {
    if (!configured) {
      mod.GoogleSignin.configure({ webClientId });
      configured = true;
    }
    await mod.GoogleSignin.hasPlayServices();
    const response: any = await mod.GoogleSignin.signIn();
    const idToken = response?.data?.idToken ?? response?.idToken;
    return idToken ? { idToken } : { cancelled: true };
  } catch {
    return { cancelled: true };
  }
}
