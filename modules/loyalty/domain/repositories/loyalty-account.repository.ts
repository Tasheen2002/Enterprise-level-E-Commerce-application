import { LoyaltyAccount } from '../entities/loyalty-account.entity';

export interface ILoyaltyAccountRepository {
  findByUserId(userId: string): Promise<LoyaltyAccount | null>;
  findById(accountId: string): Promise<LoyaltyAccount | null>;
  create(account: LoyaltyAccount): Promise<LoyaltyAccount>;
  update(account: LoyaltyAccount): Promise<LoyaltyAccount>;
  delete(accountId: string): Promise<void>;
  exists(userId: string): Promise<boolean>;
}
