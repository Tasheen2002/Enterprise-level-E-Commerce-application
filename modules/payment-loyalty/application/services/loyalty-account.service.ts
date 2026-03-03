import { ILoyaltyAccountRepository } from "../../domain/repositories/loyalty-account.repository";
import { LoyaltyAccount } from "../../domain/entities/loyalty-account.entity";

export interface LoyaltyAccountDto {
  accountId: string;
  userId: string;
  programId: string;
  pointsBalance: number;
  tier: string | null;
  updatedAt: Date;
}

export class LoyaltyAccountService {
  constructor(private readonly loyaltyAccountRepo: ILoyaltyAccountRepository) {}

  async getLoyaltyAccount(
    accountId: string,
  ): Promise<LoyaltyAccountDto | null> {
    const account = await this.loyaltyAccountRepo.findById(accountId);
    return account ? this.toDto(account) : null;
  }

  async getLoyaltyAccountByUserId(
    userId: string,
    programId: string,
  ): Promise<LoyaltyAccountDto | null> {
    const account = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      userId,
      programId,
    );
    return account ? this.toDto(account) : null;
  }

  async getUserLoyaltyAccounts(userId: string): Promise<LoyaltyAccountDto[]> {
    const accounts = await this.loyaltyAccountRepo.findByUserId(userId);
    return accounts.map((a) => this.toDto(a));
  }

  private toDto(account: LoyaltyAccount): LoyaltyAccountDto {
    return {
      accountId: account.accountId,
      userId: account.userId,
      programId: account.programId,
      pointsBalance: Number(account.pointsBalance),
      tier: account.tier,
      updatedAt: account.updatedAt,
    };
  }
}
