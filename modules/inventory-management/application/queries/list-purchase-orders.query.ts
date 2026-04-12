import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderResult } from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface ListPurchaseOrdersQuery extends IQuery {
  limit?: number;
  offset?: number;
  status?: string;
  supplierId?: string;
  sortBy?: "createdAt" | "updatedAt" | "eta";
  sortOrder?: "asc" | "desc";
}

export interface ListPurchaseOrdersResult {
  purchaseOrders: PurchaseOrderResult[];
  total: number;
}

export class ListPurchaseOrdersHandler implements IQueryHandler<
  ListPurchaseOrdersQuery,
  QueryResult<ListPurchaseOrdersResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: ListPurchaseOrdersQuery): Promise<QueryResult<ListPurchaseOrdersResult>> {
    const result = await this.poService.listPurchaseOrders({
      limit: query.limit,
      offset: query.offset,
      status: query.status,
      supplierId: query.supplierId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return QueryResult.success({ purchaseOrders: result.purchaseOrders, total: result.total });
  }
}
