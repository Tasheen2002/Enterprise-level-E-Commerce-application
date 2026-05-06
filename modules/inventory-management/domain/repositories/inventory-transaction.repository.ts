import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { InventoryTransaction } from "../entities/inventory-transaction.entity";
import { TransactionId } from "../value-objects/transaction-id.vo";
import { LocationId } from "../value-objects/location-id.vo";

export interface IInventoryTransactionRepository {
  save(transaction: InventoryTransaction): Promise<void>;
  findById(invTxnId: TransactionId): Promise<InventoryTransaction | null>;
  findByVariant(
    variantId: VariantId,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>>;
  findByLocation(
    locationId: LocationId,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>>;
  findByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
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
