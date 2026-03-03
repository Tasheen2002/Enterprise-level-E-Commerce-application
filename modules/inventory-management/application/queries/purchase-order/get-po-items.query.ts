import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface GetPOItemsQuery extends IQuery {
  poId: string;
}

export interface POItemResult {
  poId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
  isFullyReceived: boolean;
  isPartiallyReceived: boolean;
}

export class GetPOItemsHandler implements IQueryHandler<
  GetPOItemsQuery,
  QueryResult<POItemResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPOItemsQuery): Promise<QueryResult<POItemResult[]>> {
    try {
      if (!query.poId || query.poId.trim().length === 0) {
        return QueryResult.failure("poId: Purchase Order ID is required");
      }

      const items = await this.poService.getPurchaseOrderItems(query.poId);

      const results: POItemResult[] = items.map((item) => ({
        poId: item.getPoId().getValue(),
        variantId: item.getVariantId(),
        orderedQty: item.getOrderedQty(),
        receivedQty: item.getReceivedQty(),
        isFullyReceived: item.isFullyReceived(),
        isPartiallyReceived: item.isPartiallyReceived(),
      }));

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
