import { GiftCardTransaction } from "../entities/gift-card-transaction.entity";
import { GiftCardTransactionType } from "../value-objects/gift-card-transaction-type.vo";

export interface GiftCardTransactionFilterOptions {
  giftCardId?: string;
  orderId?: string;
  type?: GiftCardTransactionType;
}

export interface IGiftCardTransactionRepository {
  save(transaction: GiftCardTransaction): Promise<void>;
  findById(gcTxnId: string): Promise<GiftCardTransaction | null>;
  findByGiftCardId(giftCardId: string): Promise<GiftCardTransaction[]>;
  findByOrderId(orderId: string): Promise<GiftCardTransaction[]>;
  findWithFilters(
    filters: GiftCardTransactionFilterOptions,
  ): Promise<GiftCardTransaction[]>;
  count(filters?: GiftCardTransactionFilterOptions): Promise<number>;
}
