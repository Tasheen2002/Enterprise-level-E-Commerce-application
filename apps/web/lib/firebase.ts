/**
 * Firebase wrapper — kept dependency-free at module level so the SDK
 * (~250 KB compressed) does NOT land in the initial JS chunk for /sign-in.
 * `firebase/app` and `firebase/auth` are only imported when
 * `signInWithGoogle()` is invoked from a click handler.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export interface GoogleSignInResult {
  idToken: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const [{ initializeApp, getApps, getApp }, { getAuth, GoogleAuthProvider, signInWithPopup }] =
    await Promise.all([import("firebase/app"), import("firebase/auth")]);

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, googleProvider);
  const idToken = await credential.user.getIdToken();
  return {
    idToken,
    email: credential.user.email,
    displayName: credential.user.displayName,
    photoURL: credential.user.photoURL,
  };
}

/** 
 * PHONE VERIFICATION 
 */

export interface PhoneVerificationResult {
  confirmationResult: any;
}

/** 
 * Initializes the invisible reCAPTCHA verifier on a specific container ID.
 */
export async function setupRecaptcha(containerId: string): Promise<any> {
  const { getAuth, RecaptchaVerifier } = await import("firebase/auth");
  const { getApps, getApp, initializeApp } = await import("firebase/app");
  
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    }
  });
}

/**
 * Sends a 6-digit SMS code to the provided phone number.
 * Returns the confirmationResult needed for the next step.
 */
export async function sendPhoneCode(phoneNumber: string, verifier: any): Promise<any> {
  const { getAuth, signInWithPhoneNumber } = await import("firebase/auth");
  const { getApps, getApp, initializeApp } = await import("firebase/app");
  
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Confirms the 6-digit code and returns the Firebase ID token as proof.
 */
export async function verifyPhoneCode(confirmationResult: any, code: string): Promise<string> {
  const result = await confirmationResult.confirm(code);
  return result.user.getIdToken();
}
