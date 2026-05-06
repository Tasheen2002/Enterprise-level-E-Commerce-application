import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { PurchaseOrder } from "../entities/purchase-order.entity";
import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";
import { PurchaseOrderStatusVO } from "../value-objects/purchase-order-status.vo";
import { SupplierId } from "../value-objects/supplier-id.vo";

export interface IPurchaseOrderRepository {
  save(purchaseOrder: PurchaseOrder): Promise<void>;
  findById(poId: PurchaseOrderId): Promise<PurchaseOrder | null>;
  delete(poId: PurchaseOrderId): Promise<void>;
  findBySupplier(supplierId: SupplierId): Promise<PurchaseOrder[]>;
  findByStatus(status: PurchaseOrderStatusVO): Promise<PurchaseOrder[]>;
  findAll(options?: PurchaseOrderQueryOptions): Promise<PaginatedResult<PurchaseOrder>>;
  findOverduePurchaseOrders(): Promise<PurchaseOrder[]>;
  findPendingReceival(): Promise<PurchaseOrder[]>;
  exists(poId: PurchaseOrderId): Promise<boolean>;
}

export interface PurchaseOrderQueryOptions {
  limit?: number;
  offset?: number;
  status?: PurchaseOrderStatusVO;
  supplierId?: SupplierId;
  sortBy?: "createdAt" | "updatedAt" | "eta";
  sortOrder?: "asc" | "desc";
}
