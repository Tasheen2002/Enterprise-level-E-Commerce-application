import { GoodwillId, GoodwillType, Money } from "../value-objects/index.js";

export class GoodwillRecord {
  private constructor(
    private readonly goodwillId: GoodwillId,
    private readonly userId: string | undefined,
    private readonly orderId: string | undefined,
    private readonly type: GoodwillType,
    private readonly value: Money,
    private reason: string | undefined,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateGoodwillRecordData): GoodwillRecord {
    if (!data.value || data.value.isZero()) {
      throw new Error("Goodwill value must be greater than zero");
    }

    if (data.value.getAmount() < 0) {
      throw new Error("Goodwill value cannot be negative");
    }

    const goodwillId = GoodwillId.generate();
    const now = new Date();

    return new GoodwillRecord(
      goodwillId,
      data.userId,
      data.orderId,
      data.type,
      data.value,
      data.reason,
      now
    );
  }

  static reconstitute(data: GoodwillRecordData): GoodwillRecord {
    return new GoodwillRecord(
      GoodwillId.create(data.goodwillId),
      data.userId,
      data.orderId,
      data.type,
      data.value,
      data.reason,
      data.createdAt
    );
  }

  static fromDatabaseRow(row: GoodwillRecordDatabaseRow): GoodwillRecord {
    return new GoodwillRecord(
      GoodwillId.create(row.goodwill_id),
      row.user_id || undefined,
      row.order_id || undefined,
      GoodwillType.fromString(row.type),
      Money.create(row.value),
      row.reason || undefined,
      row.created_at
    );
  }

  // Getters
  getGoodwillId(): GoodwillId {
    return this.goodwillId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getOrderId(): string | undefined {
    return this.orderId;
  }

  getType(): GoodwillType {
    return this.type;
  }

  getValue(): Money {
    return this.value;
  }

  getReason(): string | undefined {
    return this.reason;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business logic methods
  updateReason(newReason: string): void {
    this.reason = newReason || undefined;
  }

  // Validation methods
  isStoreCredit(): boolean {
    return this.type.isStoreCredit();
  }

  isDiscount(): boolean {
    return this.type.isDiscount();
  }

  isPoints(): boolean {
    return this.type.isPoints();
  }

  isRelatedToUser(): boolean {
    return !!this.userId;
  }

  isRelatedToOrder(): boolean {
    return !!this.orderId;
  }

  hasReason(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }

  getValueAmount(): number {
    return this.value.getAmount();
  }

  // Convert to data for persistence
  toData(): GoodwillRecordData {
    return {
      goodwillId: this.goodwillId.getValue(),
      userId: this.userId,
      orderId: this.orderId,
      type: this.type,
      value: this.value,
      reason: this.reason,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): GoodwillRecordDatabaseRow {
    return {
      goodwill_id: this.goodwillId.getValue(),
      user_id: this.userId || null,
      order_id: this.orderId || null,
      type: this.type.getValue(),
      value: this.value.getAmount(),
      reason: this.reason || null,
      created_at: this.createdAt,
    };
  }

  equals(other: GoodwillRecord): boolean {
    return this.goodwillId.equals(other.goodwillId);
  }
}

// Supporting types and interfaces
export interface CreateGoodwillRecordData {
  userId?: string;
  orderId?: string;
  type: GoodwillType;
  value: Money;
  reason?: string;
}

export interface GoodwillRecordData {
  goodwillId: string;
  userId?: string;
  orderId?: string;
  type: GoodwillType;
  value: Money;
  reason?: string;
  createdAt: Date;
}

export interface GoodwillRecordDatabaseRow {
  goodwill_id: string;
  user_id: string | null;
  order_id: string | null;
  type: string;
  value: number;
  reason: string | null;
  created_at: Date;
}
