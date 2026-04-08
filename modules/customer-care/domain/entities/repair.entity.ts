import { RepairId, RepairStatus } from "../value-objects/index.js";

export class Repair {
  private constructor(
    private readonly repairId: RepairId,
    private readonly orderItemId: string,
    private notes: string | undefined,
    private status: RepairStatus | undefined
  ) {}

  static create(data: CreateRepairData): Repair {
    if (!data.orderItemId || data.orderItemId.trim().length === 0) {
      throw new Error("Order Item ID is required");
    }

    const repairId = RepairId.generate();

    return new Repair(
      repairId,
      data.orderItemId,
      data.notes,
      RepairStatus.pending()
    );
  }

  static reconstitute(data: RepairData): Repair {
    return new Repair(
      RepairId.create(data.repairId),
      data.orderItemId,
      data.notes,
      data.status
    );
  }

  static fromDatabaseRow(row: RepairDatabaseRow): Repair {
    return new Repair(
      RepairId.create(row.repair_id),
      row.order_item_id,
      row.notes || undefined,
      row.status ? RepairStatus.fromString(row.status) : undefined
    );
  }

  // Getters
  getRepairId(): RepairId {
    return this.repairId;
  }

  getOrderItemId(): string {
    return this.orderItemId;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  getStatus(): RepairStatus | undefined {
    return this.status;
  }

  // Business logic methods
  updateNotes(newNotes: string): void {
    if (this.isCompleted() || this.isFailed() || this.isCancelled()) {
      throw new Error("Cannot update notes of finalized repair");
    }

    this.notes = newNotes || undefined;
  }

  appendNotes(additionalNotes: string): void {
    if (!additionalNotes || additionalNotes.trim().length === 0) {
      return;
    }

    if (this.isCompleted() || this.isFailed() || this.isCancelled()) {
      throw new Error("Cannot update notes of finalized repair");
    }

    if (this.notes) {
      this.notes += "\n" + additionalNotes.trim();
    } else {
      this.notes = additionalNotes.trim();
    }
  }

  updateStatus(newStatus: RepairStatus): void {
    if (this.status?.equals(newStatus)) {
      return;
    }

    if (this.isCompleted() || this.isFailed() || this.isCancelled()) {
      throw new Error("Cannot change status of finalized repair");
    }

    this.status = newStatus;
  }

  startRepair(): void {
    if (!this.status?.isPending()) {
      throw new Error("Can only start repairs in pending status");
    }

    this.status = RepairStatus.inProgress();
  }

  complete(): void {
    if (!this.status?.isInProgress()) {
      throw new Error("Can only complete repairs in progress");
    }

    this.status = RepairStatus.completed();
  }

  markAsFailed(): void {
    if (this.isCompleted() || this.isCancelled()) {
      throw new Error("Cannot mark completed or cancelled repair as failed");
    }

    this.status = RepairStatus.failed();
  }

  cancel(): void {
    if (this.isCompleted() || this.isFailed()) {
      throw new Error("Cannot cancel completed or failed repair");
    }

    this.status = RepairStatus.cancelled();
  }

  // Validation methods
  isPending(): boolean {
    return this.status?.isPending() || false;
  }

  isInProgress(): boolean {
    return this.status?.isInProgress() || false;
  }

  isCompleted(): boolean {
    return this.status?.isCompleted() || false;
  }

  isFailed(): boolean {
    return this.status?.isFailed() || false;
  }

  isCancelled(): boolean {
    return this.status?.isCancelled() || false;
  }

  isFinalized(): boolean {
    return this.isCompleted() || this.isFailed() || this.isCancelled();
  }

  hasNotes(): boolean {
    return !!this.notes && this.notes.trim().length > 0;
  }

  // Convert to data for persistence
  toData(): RepairData {
    return {
      repairId: this.repairId.getValue(),
      orderItemId: this.orderItemId,
      notes: this.notes,
      status: this.status,
    };
  }

  toDatabaseRow(): RepairDatabaseRow {
    return {
      repair_id: this.repairId.getValue(),
      order_item_id: this.orderItemId,
      notes: this.notes || null,
      status: this.status?.getValue() || null,
    };
  }

  equals(other: Repair): boolean {
    return this.repairId.equals(other.repairId);
  }
}

// Supporting types and interfaces
export interface CreateRepairData {
  orderItemId: string;
  notes?: string;
}

export interface RepairData {
  repairId: string;
  orderItemId: string;
  notes?: string;
  status?: RepairStatus;
}

export interface RepairDatabaseRow {
  repair_id: string;
  order_item_id: string;
  notes: string | null;
  status: string | null;
}
