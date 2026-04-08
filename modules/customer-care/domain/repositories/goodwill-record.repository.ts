import { GoodwillRecord } from "../entities/goodwill-record.entity.js";
import { GoodwillId, GoodwillType } from "../value-objects/index.js";

export interface GoodwillRecordQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "value";
  sortOrder?: "asc" | "desc";
}

export interface GoodwillRecordFilterOptions {
  userId?: string;
  orderId?: string;
  type?: GoodwillType;
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
}

export interface IGoodwillRecordRepository {
  // Basic CRUD
  save(record: GoodwillRecord): Promise<void>;
  update(record: GoodwillRecord): Promise<void>;
  delete(goodwillId: GoodwillId): Promise<void>;

  // Finders
  findById(goodwillId: GoodwillId): Promise<GoodwillRecord | null>;
  findByUserId(
    userId: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findByOrderId(
    orderId: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findByType(
    type: GoodwillType,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findAll(options?: GoodwillRecordQueryOptions): Promise<GoodwillRecord[]>;

  // Advanced queries
  findWithFilters(
    filters: GoodwillRecordFilterOptions,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findStoreCredits(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findDiscounts(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findPoints(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]>;
  findRecentByUser(userId: string, limit?: number): Promise<GoodwillRecord[]>;

  // Aggregations
  getTotalValueByUser(userId: string, type?: GoodwillType): Promise<number>;
  getTotalValueByOrder(orderId: string, type?: GoodwillType): Promise<number>;

  // Counts
  countByType(type: GoodwillType): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  countByOrderId(orderId: string): Promise<number>;
  count(filters?: GoodwillRecordFilterOptions): Promise<number>;

  // Existence checks
  exists(goodwillId: GoodwillId): Promise<boolean>;
  hasGoodwillForUser(userId: string): Promise<boolean>;
  hasGoodwillForOrder(orderId: string): Promise<boolean>;
}
