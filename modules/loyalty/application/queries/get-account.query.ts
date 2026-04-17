import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService, LoyaltyAccountData } from '../services/loyalty.service';

export interface GetAccountQuery extends IQuery {
  readonly userId: string;
}

export class GetAccountHandler implements IQueryHandler<GetAccountQuery, LoyaltyAccountData> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetAccountQuery): Promise<LoyaltyAccountData> {
    return this.loyaltyService.getAccountDetails(query.userId);
  }
}
