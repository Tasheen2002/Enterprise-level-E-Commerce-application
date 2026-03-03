import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrderResult } from "./get-purchase-order.query";

export interface GetPendingReceivalQuery extends IQuery {}

export class GetPendingReceivalHandler implements IQueryHandler<
  GetPendingReceivalQuery,
  QueryResult<PurchaseOrderResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    query: GetPendingReceivalQuery,
  ): Promise<QueryResult<PurchaseOrderResult[]>> {
    try {
      const purchaseOrders = await this.poService.getPendingReceival();

      const results: PurchaseOrderResult[] = purchaseOrders.map((po) => ({
        poId: po.getPoId().getValue(),
        supplierId: po.getSupplierId().getValue(),
        eta: po.getEta() ?? undefined,
        status: po.getStatus().getValue(),
        createdAt: po.getCreatedAt(),
        updatedAt: po.getUpdatedAt(),
      }));

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
