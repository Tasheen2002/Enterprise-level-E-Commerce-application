import { LoyaltyAccount } from "../entities/loyalty-account.entity";
import { LoyaltyTierVO } from "../value-objects";

export interface LoyaltyAccountFilterOptions {
  userId?: string;
  programId?: string;
  tier?: LoyaltyTierVO;
  minPoints?: number;
}

export interface LoyaltyAccountQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ILoyaltyAccountRepository {
  save(account: LoyaltyAccount): Promise<void>;
  update(account: LoyaltyAccount): Promise<void>;
  delete(accountId: string): Promise<void>;
  findById(accountId: string): Promise<LoyaltyAccount | null>;
  findByUserId(userId: string): Promise<LoyaltyAccount[]>;
  findByUserIdAndProgramId(
    userId: string,
    programId: string,
  ): Promise<LoyaltyAccount | null>;
  findWithFilters(
    filters: LoyaltyAccountFilterOptions,
    options?: LoyaltyAccountQueryOptions,
  ): Promise<LoyaltyAccount[]>;
  count(filters?: LoyaltyAccountFilterOptions): Promise<number>;
  exists(accountId: string): Promise<boolean>;
}
