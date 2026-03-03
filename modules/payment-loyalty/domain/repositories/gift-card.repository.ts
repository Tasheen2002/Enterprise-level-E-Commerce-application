import { GiftCard } from "../entities/gift-card.entity";
import { GiftCardStatus } from "../value-objects/gift-card-status.vo";

export interface GiftCardFilterOptions {
  status?: GiftCardStatus;
  expiresAfter?: Date;
  expiresBefore?: Date;
  hasBalance?: boolean;
}

export interface GiftCardQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface IGiftCardRepository {
  save(giftCard: GiftCard): Promise<void>;
  update(giftCard: GiftCard): Promise<void>;
  delete(giftCardId: string): Promise<void>;
  findById(giftCardId: string): Promise<GiftCard | null>;
  findByCode(code: string): Promise<GiftCard | null>;
  findWithFilters(
    filters: GiftCardFilterOptions,
    options?: GiftCardQueryOptions,
  ): Promise<GiftCard[]>;
  count(filters?: GiftCardFilterOptions): Promise<number>;
  exists(giftCardId: string): Promise<boolean>;
}
