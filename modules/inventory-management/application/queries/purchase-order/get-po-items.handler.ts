import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetPOItemsQuery, POItemResult } from "./get-po-items.query";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export class GetPOItemsHandler implements IQueryHandler<
  GetPOItemsQuery,
  QueryResult<POItemResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPOItemsQuery): Promise<QueryResult<POItemResult[]>> {
    try {
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
