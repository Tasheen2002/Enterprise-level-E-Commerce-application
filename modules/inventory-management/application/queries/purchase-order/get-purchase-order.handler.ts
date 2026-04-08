import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetPurchaseOrderQuery,
  PurchaseOrderResult,
} from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export class GetPurchaseOrderHandler implements IQueryHandler<
  GetPurchaseOrderQuery,
  QueryResult<PurchaseOrderResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    query: GetPurchaseOrderQuery,
  ): Promise<QueryResult<PurchaseOrderResult>> {
    try {
      const purchaseOrder = await this.poService.getPurchaseOrder(query.poId);

      const result: PurchaseOrderResult = {
        poId: purchaseOrder.getPoId().getValue(),
        supplierId: purchaseOrder.getSupplierId().getValue(),
        eta: purchaseOrder.getEta() ?? undefined,
        status: purchaseOrder.getStatus().getValue(),
        createdAt: purchaseOrder.getCreatedAt(),
        updatedAt: purchaseOrder.getUpdatedAt(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
