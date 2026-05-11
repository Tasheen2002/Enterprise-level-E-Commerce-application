export interface IFirebaseAuthVerifier {
  /**
   * Verify a Firebase ID token issued by the Google sign-in provider
   * (popup / redirect). The decoded identity is expected to carry an
   * email — used to match an existing app account or auto-provision a
   * new one.
   */
  verifyIdToken(idToken: string): Promise<VerifiedFirebaseIdentity>;

  /**
   * Verify a Firebase ID token issued by the Phone sign-in provider
   * (signInWithPhoneNumber + OTP confirm). The decoded identity is
   * expected to carry a `phone_number` claim — that's the only field
   * we trust on the wire; the client may not pass the phone number
   * separately.
   */
  verifyPhoneIdToken(idToken: string): Promise<VerifiedFirebasePhoneIdentity>;
}

export interface VerifiedFirebaseIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

export interface VerifiedFirebasePhoneIdentity {
  uid: string;
  phoneNumber: string;
}
