import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import {
  CreatePurchaseOrderWithItemsCommand,
  CreatePurchaseOrderWithItemsResult,
} from "./create-purchase-order-with-items.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export class CreatePurchaseOrderWithItemsHandler implements ICommandHandler<
  CreatePurchaseOrderWithItemsCommand,
  CommandResult<CreatePurchaseOrderWithItemsResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: CreatePurchaseOrderWithItemsCommand,
  ): Promise<CommandResult<CreatePurchaseOrderWithItemsResult>> {
    try {
      // Validate inputs
      const errors: string[] = [];

      if (!command.supplierId || command.supplierId.trim().length === 0) {
        errors.push("supplierId: Supplier ID is required");
      }

      if (!Array.isArray(command.items) || command.items.length === 0) {
        errors.push("items: At least one item is required");
      } else {
        command.items.forEach((item, index) => {
          if (!item.variantId || item.variantId.trim().length === 0) {
            errors.push(`items[${index}].variantId: Variant ID is required`);
          }
          if (!item.orderedQty || item.orderedQty <= 0) {
            errors.push(
              `items[${index}].orderedQty: Ordered quantity must be greater than 0`,
            );
          }
        });
      }

      if (errors.length > 0) {
        return CommandResult.failure<CreatePurchaseOrderWithItemsResult>(
          `Validation failed: ${errors.join("; ")}`,
        );
      }

      // Create the purchase order
      const purchaseOrder = await this.poService.createPurchaseOrder(
        command.supplierId,
        command.eta,
      );

      // Add all items
      const addedItems = [];
      for (const item of command.items) {
        const poItem = await this.poService.addPurchaseOrderItem(
          purchaseOrder.getPoId().getValue(),
          item.variantId,
          item.orderedQty,
        );
        addedItems.push(poItem);
      }

      return CommandResult.success<CreatePurchaseOrderWithItemsResult>({
        purchaseOrder: {
          poId: purchaseOrder.getPoId().getValue(),
          supplierId: purchaseOrder.getSupplierId().getValue(),
          eta: purchaseOrder.getEta(),
          status: purchaseOrder.getStatus().getValue(),
          createdAt: purchaseOrder.getCreatedAt(),
          updatedAt: purchaseOrder.getUpdatedAt(),
        },
        items: addedItems.map((i) => ({
          variantId: i.getVariantId(),
          orderedQty: i.getOrderedQty(),
        })),
      });
    } catch (error) {
      return CommandResult.failure<CreatePurchaseOrderWithItemsResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
