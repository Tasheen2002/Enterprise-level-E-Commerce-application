import { ReturnRequest } from "../entities/return-request.entity.js";
import { RmaId, RmaType, RmaStatus } from "../value-objects/index.js";

export interface ReturnRequestQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ReturnRequestFilterOptions {
  orderId?: string;
  type?: RmaType;
  status?: RmaStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface IReturnRequestRepository {
  // Basic CRUD
  save(returnRequest: ReturnRequest): Promise<void>;
  update(returnRequest: ReturnRequest): Promise<void>;
  delete(rmaId: RmaId): Promise<void>;

  // Finders
  findById(rmaId: RmaId): Promise<ReturnRequest | null>;
  findByOrderId(
    orderId: string,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]>;
  findByType(
    type: RmaType,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]>;
  findByStatus(
    status: RmaStatus,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]>;
  findAll(options?: ReturnRequestQueryOptions): Promise<ReturnRequest[]>;

  // Advanced queries
  findWithFilters(
    filters: ReturnRequestFilterOptions,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]>;
  findPendingEligibility(
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]>;
  findApproved(options?: ReturnRequestQueryOptions): Promise<ReturnRequest[]>;
  findInTransit(options?: ReturnRequestQueryOptions): Promise<ReturnRequest[]>;
  findRecentByOrder(orderId: string, limit?: number): Promise<ReturnRequest[]>;

  // Counts
  countByStatus(status: RmaStatus): Promise<number>;
  countByOrderId(orderId: string): Promise<number>;
  countByType(type: RmaType): Promise<number>;
  count(filters?: ReturnRequestFilterOptions): Promise<number>;

  // Existence checks
  exists(rmaId: RmaId): Promise<boolean>;
  hasOrderReturns(orderId: string): Promise<boolean>;
  hasActiveReturnForOrder(orderId: string): Promise<boolean>;
}
