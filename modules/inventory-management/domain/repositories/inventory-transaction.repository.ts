import { InventoryTransaction } from "../entities/inventory-transaction.entity";
import { TransactionId } from "../value-objects/transaction-id.vo";

export interface IInventoryTransactionRepository {
  save(transaction: InventoryTransaction): Promise<void>;
  findById(invTxnId: TransactionId): Promise<InventoryTransaction | null>;
  findByVariant(variantId: string, options?: InventoryTransactionPageOptions): Promise<{ transactions: InventoryTransaction[]; total: number }>;
  findByLocation(locationId: string, options?: InventoryTransactionPageOptions): Promise<{ transactions: InventoryTransaction[]; total: number }>;
  findByVariantAndLocation(variantId: string, locationId: string, options?: InventoryTransactionPageOptions): Promise<{ transactions: InventoryTransaction[]; total: number }>;
  findByReference(referenceId: string): Promise<InventoryTransaction[]>;
  findAll(options?: InventoryTransactionQueryOptions): Promise<{ transactions: InventoryTransaction[]; total: number }>;
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
