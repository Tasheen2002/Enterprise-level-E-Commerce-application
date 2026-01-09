import {
  VerificationToken,
  VerificationType,
} from "../entities/verification-token.entity";

export interface IVerificationTokenRepository {
  save(token: VerificationToken): Promise<void>;
  findByToken(
    token: string,
    type: VerificationType
  ): Promise<VerificationToken | null>;
  findByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<VerificationToken | null>;
  findActiveByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<VerificationToken | null>;
  deleteByUserIdAndType(userId: string, type: VerificationType): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteUsed(): Promise<number>;
}
