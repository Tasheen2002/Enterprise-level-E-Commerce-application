export interface IFirebaseAuthVerifier {
  verifyIdToken(idToken: string): Promise<VerifiedFirebaseIdentity>;
}

export interface VerifiedFirebaseIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}
