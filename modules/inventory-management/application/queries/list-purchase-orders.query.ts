import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
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

export class ListPurchaseOrdersHandler implements IQueryHandler<
  ListPurchaseOrdersQuery,
  PaginatedResult<PurchaseOrderResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: ListPurchaseOrdersQuery): Promise<PaginatedResult<PurchaseOrderResult>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.poService.listPurchaseOrders({
      limit,
      offset,
      status: query.status,
      supplierId: query.supplierId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      items: result.purchaseOrders,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.purchaseOrders.length < result.total,
    };
  }
}
