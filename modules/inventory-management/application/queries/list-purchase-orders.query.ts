import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderResult } from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface ListPurchaseOrdersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly status?: string;
  readonly supplierId?: string;
  readonly sortBy?: "createdAt" | "updatedAt" | "eta";
  readonly sortOrder?: "asc" | "desc";
}

export interface ListPurchaseOrdersResult {
  readonly purchaseOrders: PurchaseOrderResult[];
  readonly total: number;
}

export class ListPurchaseOrdersHandler implements IQueryHandler<
  ListPurchaseOrdersQuery,
  ListPurchaseOrdersResult
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: ListPurchaseOrdersQuery): Promise<ListPurchaseOrdersResult> {
    const result = await this.poService.listPurchaseOrders({
      limit: query.limit,
      offset: query.offset,
      status: query.status,
      supplierId: query.supplierId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { purchaseOrders: result.purchaseOrders, total: result.total };
  }
}
