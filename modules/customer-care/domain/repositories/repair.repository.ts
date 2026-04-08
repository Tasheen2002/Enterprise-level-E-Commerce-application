import { Repair } from "../entities/repair.entity.js";
import { RepairId, RepairStatus } from "../value-objects/index.js";

export interface RepairQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface RepairFilterOptions {
  orderItemId?: string;
  status?: RepairStatus;
  hasNotes?: boolean;
}

export interface IRepairRepository {
  // Basic CRUD
  save(repair: Repair): Promise<void>;
  update(repair: Repair): Promise<void>;
  delete(repairId: RepairId): Promise<void>;

  // Finders
  findById(repairId: RepairId): Promise<Repair | null>;
  findByOrderItemId(
    orderItemId: string,
    options?: RepairQueryOptions
  ): Promise<Repair[]>;
  findByStatus(
    status: RepairStatus,
    options?: RepairQueryOptions
  ): Promise<Repair[]>;
  findAll(options?: RepairQueryOptions): Promise<Repair[]>;

  // Advanced queries
  findWithFilters(
    filters: RepairFilterOptions,
    options?: RepairQueryOptions
  ): Promise<Repair[]>;
  findPending(options?: RepairQueryOptions): Promise<Repair[]>;
  findInProgress(options?: RepairQueryOptions): Promise<Repair[]>;
  findCompleted(options?: RepairQueryOptions): Promise<Repair[]>;
  findFailed(options?: RepairQueryOptions): Promise<Repair[]>;

  // Counts
  countByStatus(status: RepairStatus): Promise<number>;
  countByOrderItemId(orderItemId: string): Promise<number>;
  count(filters?: RepairFilterOptions): Promise<number>;

  // Existence checks
  exists(repairId: RepairId): Promise<boolean>;
  hasActiveRepairForItem(orderItemId: string): Promise<boolean>;
}
