import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
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

export class GetPurchaseOrderQueryHandler implements IQueryHandler<
  GetPurchaseOrderQuery,
  CommandResult<PurchaseOrderResult | null>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    query: GetPurchaseOrderQuery,
  ): Promise<CommandResult<PurchaseOrderResult | null>> {
    try {
      const errors: string[] = [];

      if (!query.poId || query.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<PurchaseOrderResult | null>(
          "Validation failed",
          errors,
        );
      }

      const purchaseOrder = await this.poService.getPurchaseOrder(query.poId);

      if (!purchaseOrder) {
        return CommandResult.success<PurchaseOrderResult | null>(null);
      }

      const result: PurchaseOrderResult = {
        poId: purchaseOrder.getPoId().getValue(),
        supplierId: purchaseOrder.getSupplierId().getValue(),
        eta: purchaseOrder.getEta() ?? undefined,
        status: purchaseOrder.getStatus().getValue(),
        createdAt: purchaseOrder.getCreatedAt(),
        updatedAt: purchaseOrder.getUpdatedAt(),
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<PurchaseOrderResult | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { GetPurchaseOrderQueryHandler as GetPurchaseOrderHandler };
