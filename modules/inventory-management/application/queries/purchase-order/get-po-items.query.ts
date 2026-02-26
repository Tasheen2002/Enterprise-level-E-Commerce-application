import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
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

export class GetPOItemsQueryHandler implements IQueryHandler<
  GetPOItemsQuery,
  CommandResult<POItemResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPOItemsQuery): Promise<CommandResult<POItemResult[]>> {
    try {
      const errors: string[] = [];

      if (!query.poId || query.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<POItemResult[]>(
          "Validation failed",
          errors,
        );
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

      return CommandResult.success(results);
    } catch (error) {
      return CommandResult.failure<POItemResult[]>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { GetPOItemsQueryHandler as GetPOItemsHandler };
