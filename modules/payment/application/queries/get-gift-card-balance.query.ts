import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService } from '../services/gift-card.service';

export interface GetGiftCardBalanceQuery extends IQuery {
  readonly codeOrId: string;
}

export class GetGiftCardBalanceHandler implements IQueryHandler<
  GetGiftCardBalanceQuery,
  QueryResult<number>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(query: GetGiftCardBalanceQuery): Promise<QueryResult<number>> {
    const balance = await this.giftCardService.getGiftCardBalance(query.codeOrId);
    if (balance === null) {
      return QueryResult.failure('Gift card not found');
    }
    return QueryResult.success(balance);
  }
}
