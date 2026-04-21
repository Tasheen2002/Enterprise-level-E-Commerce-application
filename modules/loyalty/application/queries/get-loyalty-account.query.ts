import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService, LoyaltyAccountDetailsDTO } from '../services';

export interface GetLoyaltyAccountQuery extends IQuery {
  readonly userId: string;
}

export class GetLoyaltyAccountHandler implements IQueryHandler<GetLoyaltyAccountQuery, LoyaltyAccountDetailsDTO> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetLoyaltyAccountQuery): Promise<LoyaltyAccountDetailsDTO> {
    return this.loyaltyService.getAccountDetails(query.userId);
  }
}
