import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService, LoyaltyAccountData } from '../services/loyalty.service';

export interface GetLoyaltyAccountQuery extends IQuery {
  readonly userId: string;
}

export class GetLoyaltyAccountHandler implements IQueryHandler<GetLoyaltyAccountQuery, LoyaltyAccountData> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetLoyaltyAccountQuery): Promise<LoyaltyAccountData> {
    return this.loyaltyService.getAccountDetails(query.userId);
  }
}
