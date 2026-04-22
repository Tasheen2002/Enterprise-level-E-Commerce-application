import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { PurchaseOrder } from "../entities/purchase-order.entity";
import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";
import { PurchaseOrderStatus } from "../value-objects/purchase-order-status.vo";

export interface IPurchaseOrderRepository {
  save(purchaseOrder: PurchaseOrder): Promise<void>;
  findById(poId: PurchaseOrderId): Promise<PurchaseOrder | null>;
  delete(poId: PurchaseOrderId): Promise<void>;
  findBySupplier(supplierId: string): Promise<PurchaseOrder[]>;
  findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]>;
  findAll(options?: PurchaseOrderQueryOptions): Promise<PaginatedResult<PurchaseOrder>>;
  findOverduePurchaseOrders(): Promise<PurchaseOrder[]>;
  findPendingReceival(): Promise<PurchaseOrder[]>;
  exists(poId: PurchaseOrderId): Promise<boolean>;
}

export interface PurchaseOrderQueryOptions {
  limit?: number;
  offset?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  sortBy?: "createdAt" | "updatedAt" | "eta";
  sortOrder?: "asc" | "desc";
}
