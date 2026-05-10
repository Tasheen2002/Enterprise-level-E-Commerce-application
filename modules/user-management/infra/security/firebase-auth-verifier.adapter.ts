import {
  initializeApp,
  cert,
  getApps,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  IFirebaseAuthVerifier,
  VerifiedFirebaseIdentity,
} from "../../application/services/ifirebase-auth-verifier.service";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors/user-management.errors";

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export class FirebaseAuthVerifierAdapter implements IFirebaseAuthVerifier {
  private readonly app: App;

  constructor(config: FirebaseAdminConfig) {
    // firebase-admin throws on duplicate-init; reuse if already created.
    const existing = getApps().find((a) => a.name === "tasheen-admin");
    this.app =
      existing ??
      initializeApp(
        {
          credential: cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey: config.privateKey,
          }),
        },
        "tasheen-admin",
      );
  }

  async verifyIdToken(idToken: string): Promise<VerifiedFirebaseIdentity> {
    let decoded;
    try {
      decoded = await getAuth(this.app).verifyIdToken(idToken);
    } catch {
      throw new DomainValidationError("Invalid Google sign-in token");
    }

    if (!decoded.email) {
      throw new InvalidOperationError(
        "Google account did not return an email address",
      );
    }

    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified === true,
      name: (decoded.name as string | undefined) ?? null,
      picture: (decoded.picture as string | undefined) ?? null,
    };
  }
}
