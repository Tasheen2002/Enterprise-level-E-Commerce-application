import { RmaId, RmaType, RmaStatus } from "../value-objects/index.js";

export class ReturnRequest {
  private constructor(
    private readonly rmaId: RmaId,
    private readonly orderId: string,
    private readonly type: RmaType,
    private reason: string | undefined,
    private status: RmaStatus,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(data: CreateReturnRequestData): ReturnRequest {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const rmaId = RmaId.generate();
    const now = new Date();

    return new ReturnRequest(
      rmaId,
      data.orderId,
      data.type,
      data.reason,
      RmaStatus.eligibility(),
      now,
      now
    );
  }

  static reconstitute(data: ReturnRequestData): ReturnRequest {
    return new ReturnRequest(
      RmaId.create(data.rmaId),
      data.orderId,
      data.type,
      data.reason,
      data.status,
      data.createdAt,
      data.updatedAt
    );
  }

  static fromDatabaseRow(row: ReturnRequestDatabaseRow): ReturnRequest {
    return new ReturnRequest(
      RmaId.create(row.rma_id),
      row.order_id,
      RmaType.fromString(row.type),
      row.reason || undefined,
      RmaStatus.fromString(row.status),
      row.created_at,
      row.updated_at
    );
  }

  // Getters
  getRmaId(): RmaId {
    return this.rmaId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getType(): RmaType {
    return this.type;
  }

  getReason(): string | undefined {
    return this.reason;
  }

  getStatus(): RmaStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  updateReason(newReason: string): void {
    if (this.status.isRefunded() || this.status.isRejected()) {
      throw new Error("Cannot update reason of finalized return request");
    }

    this.reason = newReason || undefined;
    this.updatedAt = new Date();
  }

  updateStatus(newStatus: RmaStatus): void {
    if (this.status.equals(newStatus)) {
      return;
    }

    // Business rules for status transitions
    if (this.status.isRefunded() || this.status.isRejected()) {
      throw new Error("Cannot change status of finalized return request");
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }

  approve(): void {
    if (!this.status.isEligibility()) {
      throw new Error("Can only approve requests in eligibility status");
    }

    this.status = RmaStatus.approved();
    this.updatedAt = new Date();
  }

  reject(): void {
    if (this.status.isRefunded() || this.status.isRejected()) {
      throw new Error("Return request is already finalized");
    }

    this.status = RmaStatus.rejected();
    this.updatedAt = new Date();
  }

  markAsInTransit(): void {
    if (!this.status.isApproved()) {
      throw new Error("Can only mark approved requests as in transit");
    }

    this.status = RmaStatus.inTransit();
    this.updatedAt = new Date();
  }

  markAsReceived(): void {
    if (!this.status.isInTransit()) {
      throw new Error("Can only mark in-transit requests as received");
    }

    this.status = RmaStatus.received();
    this.updatedAt = new Date();
  }

  markAsRefunded(): void {
    if (!this.status.isReceived()) {
      throw new Error("Can only refund received returns");
    }

    this.status = RmaStatus.refunded();
    this.updatedAt = new Date();
  }

  // Validation methods
  isReturn(): boolean {
    return this.type.isReturn();
  }

  isExchange(): boolean {
    return this.type.isExchange();
  }

  isGiftReturn(): boolean {
    return this.type.isGiftReturn();
  }

  isEligibilityPending(): boolean {
    return this.status.isEligibility();
  }

  isApproved(): boolean {
    return this.status.isApproved();
  }

  isRejected(): boolean {
    return this.status.isRejected();
  }

  isInTransit(): boolean {
    return this.status.isInTransit();
  }

  isReceived(): boolean {
    return this.status.isReceived();
  }

  isRefunded(): boolean {
    return this.status.isRefunded();
  }

  isFinalized(): boolean {
    return this.status.isRefunded() || this.status.isRejected();
  }

  hasReason(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }

  // Convert to data for persistence
  toData(): ReturnRequestData {
    return {
      rmaId: this.rmaId.getValue(),
      orderId: this.orderId,
      type: this.type,
      reason: this.reason,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDatabaseRow(): ReturnRequestDatabaseRow {
    return {
      rma_id: this.rmaId.getValue(),
      order_id: this.orderId,
      type: this.type.getValue(),
      reason: this.reason || null,
      status: this.status.getValue(),
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  equals(other: ReturnRequest): boolean {
    return this.rmaId.equals(other.rmaId);
  }
}

// Supporting types and interfaces
export interface CreateReturnRequestData {
  orderId: string;
  type: RmaType;
  reason?: string;
}

export interface ReturnRequestData {
  rmaId: string;
  orderId: string;
  type: RmaType;
  reason?: string;
  status: RmaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnRequestDatabaseRow {
  rma_id: string;
  order_id: string;
  type: string;
  reason: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
