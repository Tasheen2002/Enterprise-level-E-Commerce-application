import { VerificationRateLimit } from "../entities/verification-rate-limit.entity";
import { VerificationType } from "../enums/verification-type.enum";

export interface IVerificationRateLimitRepository {
  save(rateLimit: VerificationRateLimit): Promise<void>;
  findByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<VerificationRateLimit | null>;
  findByEmailAndType(
    email: string,
    type: VerificationType
  ): Promise<VerificationRateLimit | null>;
  findByPhoneAndType(
    phone: string,
    type: VerificationType
  ): Promise<VerificationRateLimit | null>;
  deleteExpired(): Promise<number>;
}
