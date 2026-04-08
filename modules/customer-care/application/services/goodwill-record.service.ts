import {
  IGoodwillRecordRepository,
  GoodwillRecordQueryOptions,
  GoodwillRecordFilterOptions,
} from "../../domain/repositories/goodwill-record.repository.js";
import { GoodwillRecord } from "../../domain/entities/goodwill-record.entity.js";
import {
  GoodwillId,
  GoodwillType,
  Money,
} from "../../domain/value-objects/index.js";

export class GoodwillRecordService {
  constructor(private readonly goodwillRepository: IGoodwillRecordRepository) {}

  async createRecord(data: {
    userId?: string;
    orderId?: string;
    type: GoodwillType;
    value: Money;
    reason?: string;
  }): Promise<GoodwillRecord> {
    const record = GoodwillRecord.create({
      userId: data.userId,
      orderId: data.orderId,
      type: data.type,
      value: data.value,
      reason: data.reason,
    });

    await this.goodwillRepository.save(record);
    return record;
  }

  async getRecord(goodwillId: string): Promise<GoodwillRecord | null> {
    return await this.goodwillRepository.findById(
      GoodwillId.create(goodwillId)
    );
  }

  async updateRecord(
    goodwillId: string,
    data: {
      reason?: string;
    }
  ): Promise<void> {
    const record = await this.goodwillRepository.findById(
      GoodwillId.create(goodwillId)
    );

    if (!record) {
      throw new Error(`Goodwill record with ID ${goodwillId} not found`);
    }

    if (data.reason !== undefined) {
      record.updateReason(data.reason);
    }

    await this.goodwillRepository.update(record);
  }

  async deleteRecord(goodwillId: string): Promise<void> {
    const exists = await this.goodwillRepository.exists(
      GoodwillId.create(goodwillId)
    );

    if (!exists) {
      throw new Error(`Goodwill record with ID ${goodwillId} not found`);
    }

    await this.goodwillRepository.delete(GoodwillId.create(goodwillId));
  }

  async getRecordsByUser(
    userId: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findByUserId(userId, options);
  }

  async getRecordsByOrder(
    orderId: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findByOrderId(orderId, options);
  }

  async getRecordsByType(
    type: GoodwillType,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findByType(type, options);
  }

  async getStoreCredits(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findStoreCredits(userId, options);
  }

  async getDiscounts(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findDiscounts(userId, options);
  }

  async getPoints(
    userId?: string,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findPoints(userId, options);
  }

  async getRecentRecordsByUser(
    userId: string,
    limit?: number
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findRecentByUser(userId, limit);
  }

  async getRecordsWithFilters(
    filters: GoodwillRecordFilterOptions,
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findWithFilters(filters, options);
  }

  async getAllRecords(
    options?: GoodwillRecordQueryOptions
  ): Promise<GoodwillRecord[]> {
    return await this.goodwillRepository.findAll(options);
  }

  async getTotalValueByUser(
    userId: string,
    type?: GoodwillType
  ): Promise<number> {
    return await this.goodwillRepository.getTotalValueByUser(userId, type);
  }

  async getTotalValueByOrder(
    orderId: string,
    type?: GoodwillType
  ): Promise<number> {
    return await this.goodwillRepository.getTotalValueByOrder(orderId, type);
  }

  async countRecordsByType(type: GoodwillType): Promise<number> {
    return await this.goodwillRepository.countByType(type);
  }

  async countRecordsByUser(userId: string): Promise<number> {
    return await this.goodwillRepository.countByUserId(userId);
  }

  async countRecordsByOrder(orderId: string): Promise<number> {
    return await this.goodwillRepository.countByOrderId(orderId);
  }

  async countRecords(filters?: GoodwillRecordFilterOptions): Promise<number> {
    return await this.goodwillRepository.count(filters);
  }

  async recordExists(goodwillId: string): Promise<boolean> {
    return await this.goodwillRepository.exists(GoodwillId.create(goodwillId));
  }

  async hasGoodwillForUser(userId: string): Promise<boolean> {
    return await this.goodwillRepository.hasGoodwillForUser(userId);
  }

  async hasGoodwillForOrder(orderId: string): Promise<boolean> {
    return await this.goodwillRepository.hasGoodwillForOrder(orderId);
  }
}
