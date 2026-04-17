import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService } from '../services/gift-card.service';
import { GiftCardTransactionDTO } from '../../domain/entities/gift-card-transaction.entity';

export interface GetGiftCardTransactionsQuery extends IQuery {
  readonly giftCardId: string;
}

export class GetGiftCardTransactionsHandler implements IQueryHandler<
  GetGiftCardTransactionsQuery,
  GiftCardTransactionDTO[]
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(query: GetGiftCardTransactionsQuery): Promise<GiftCardTransactionDTO[]> {
    return this.giftCardService.getGiftCardTransactions(query.giftCardId);
  }
}
