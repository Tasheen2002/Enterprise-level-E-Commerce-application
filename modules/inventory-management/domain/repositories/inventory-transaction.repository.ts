import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { InventoryTransaction } from "../entities/inventory-transaction.entity";
import { TransactionId } from "../value-objects/transaction-id.vo";

export interface IInventoryTransactionRepository {
  save(transaction: InventoryTransaction): Promise<void>;
  findById(invTxnId: TransactionId): Promise<InventoryTransaction | null>;
  findByVariant(
    variantId: string,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>>;
  findByLocation(
    locationId: string,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>>;
  findByVariantAndLocation(
    variantId: string,
    locationId: string,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>>;
  findByReference(referenceId: string): Promise<InventoryTransaction[]>;
  findAll(
    options?: InventoryTransactionQueryOptions,
  ): Promise<PaginatedResult<InventoryTransaction>>;
}

export interface InventoryTransactionPageOptions {
  limit?: number;
  offset?: number;
}

export interface InventoryTransactionQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}
