import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface GetPurchaseOrderQuery extends IQuery {
  poId: string;
}

export interface PurchaseOrderResult {
  poId: string;
  supplierId: string;
  eta?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetPurchaseOrderHandler implements IQueryHandler<
  GetPurchaseOrderQuery,
  QueryResult<PurchaseOrderResult | null>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    query: GetPurchaseOrderQuery,
  ): Promise<QueryResult<PurchaseOrderResult | null>> {
    try {
      if (!query.poId || query.poId.trim().length === 0) {
        return QueryResult.failure("poId: Purchase Order ID is required");
      }

      const purchaseOrder = await this.poService.getPurchaseOrder(query.poId);

      if (!purchaseOrder) {
        return QueryResult.success<PurchaseOrderResult | null>(null);
      }

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
