import { ILoyaltyAccountRepository } from '../../domain/repositories/loyalty-account.repository';
import { LoyaltyAccount, LoyaltyAccountDTO } from '../../domain/entities/loyalty-account.entity';
import { LoyaltyAccountId } from '../../domain/value-objects/loyalty-account-id.vo';

export class LoyaltyAccountService {
  constructor(private readonly loyaltyAccountRepository: ILoyaltyAccountRepository) {}

  async getLoyaltyAccount(accountId: string): Promise<LoyaltyAccountDTO | null> {
    const account = await this.loyaltyAccountRepository.findById(
      LoyaltyAccountId.fromString(accountId),
    );
    return account ? LoyaltyAccount.toDTO(account) : null;
  }

  async getLoyaltyAccountByUserId(userId: string): Promise<LoyaltyAccountDTO | null> {
    const account = await this.loyaltyAccountRepository.findByUserId(userId);
    return account ? LoyaltyAccount.toDTO(account) : null;
  }
}
