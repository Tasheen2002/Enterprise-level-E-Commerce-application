import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrderResult } from "./get-purchase-order.query";

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

  async handle(
    query: ListPurchaseOrdersQuery,
  ): Promise<QueryResult<ListPurchaseOrdersResult>> {
    try {
      const result = await this.poService.listPurchaseOrders({
        limit: query.limit,
        offset: query.offset,
        status: query.status,
        supplierId: query.supplierId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const purchaseOrders: PurchaseOrderResult[] = result.purchaseOrders.map(
        (po) => ({
          poId: po.getPoId().getValue(),
          supplierId: po.getSupplierId().getValue(),
          eta: po.getEta() ?? undefined,
          status: po.getStatus().getValue(),
          createdAt: po.getCreatedAt(),
          updatedAt: po.getUpdatedAt(),
        }),
      );

      return QueryResult.success({
        purchaseOrders,
        total: result.total,
      });
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
