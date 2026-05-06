// Port (interface only) for password hashing. The bcrypt-backed implementation
// lives in `infra/security/bcrypt-password-hasher.adapter.ts` so that
// third-party crypto libraries don't leak into the application layer. Service
// callers depend on this interface; the container wires the adapter at boot.
export interface IPasswordHasherService {
  hash(password: string | null): Promise<string | null>;
  verify(password: string, hash: string | null): Promise<boolean>;
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  };
}
