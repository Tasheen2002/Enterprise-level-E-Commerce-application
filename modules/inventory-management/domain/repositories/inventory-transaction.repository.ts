import { InventoryTransaction } from "../entities/inventory-transaction.entity";
import { TransactionId } from "../value-objects/transaction-id.vo";

export interface IInventoryTransactionRepository {
  save(transaction: InventoryTransaction): Promise<void>;
  findById(invTxnId: TransactionId): Promise<InventoryTransaction | null>;
  findByVariant(
    variantId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransaction[]; total: number }>;

  findByLocation(
    locationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransaction[]; total: number }>;

  findByVariantAndLocation(
    variantId: string,
    locationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransaction[]; total: number }>;

  findByReference(referenceId: string): Promise<InventoryTransaction[]>;

  findAll(options?: {
    limit?: number;
    offset?: number;
    sortBy?: "createdAt";
    sortOrder?: "asc" | "desc";
  }): Promise<{ transactions: InventoryTransaction[]; total: number }>;
}
