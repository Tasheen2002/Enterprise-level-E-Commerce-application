import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService, GiftCardTransactionDto } from '../services/gift-card.service';

export interface GetGiftCardTransactionsQuery extends IQuery {
  readonly giftCardId: string;
}

export class GetGiftCardTransactionsHandler implements IQueryHandler<
  GetGiftCardTransactionsQuery,
  GiftCardTransactionDto[]
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(query: GetGiftCardTransactionsQuery): Promise<GiftCardTransactionDto[]> {
    return this.giftCardService.getGiftCardTransactions(query.giftCardId);
  }
}
