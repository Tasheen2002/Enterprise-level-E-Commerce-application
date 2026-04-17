import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService, GiftCardTransactionDto } from '../services/gift-card.service';

export interface GetGiftCardTransactionsQuery extends IQuery {
  readonly giftCardId: string;
}

export class GetGiftCardTransactionsHandler implements IQueryHandler<
  GetGiftCardTransactionsQuery,
  QueryResult<GiftCardTransactionDto[]>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(query: GetGiftCardTransactionsQuery): Promise<QueryResult<GiftCardTransactionDto[]>> {
    const txns = await this.giftCardService.getGiftCardTransactions(query.giftCardId);
    return QueryResult.success(txns);
  }
}
