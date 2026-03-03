import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";

export interface ReceivePOItemsCommand extends ICommand {
  poId: string;
  locationId: string;
  items: { variantId: string; receivedQty: number }[];
}

export interface ReceivePOItemsResult {
  purchaseOrder: PurchaseOrder;
  items: PurchaseOrderItem[];
}

export class ReceivePOItemsHandler implements ICommandHandler<
  ReceivePOItemsCommand,
  CommandResult<ReceivePOItemsResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: ReceivePOItemsCommand,
  ): Promise<CommandResult<ReceivePOItemsResult>> {
    try {
      const errors: string[] = [];

      if (!command.poId || command.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (!command.items || command.items.length === 0) {
        errors.push("items: At least one item must be provided");
      }

      if (command.items) {
        command.items.forEach((item, index) => {
          if (!item.variantId || item.variantId.trim().length === 0) {
            errors.push(`items[${index}].variantId: Variant ID is required`);
          }
          if (!item.receivedQty || item.receivedQty <= 0) {
            errors.push(
              `items[${index}].receivedQty: Received quantity must be greater than 0`,
            );
          }
        });
      }

      if (errors.length > 0) {
        return CommandResult.failure<ReceivePOItemsResult>(
          "Validation failed",
          errors,
        );
      }

      const result = await this.poService.receivePurchaseOrderItems(
        command.poId,
        command.locationId,
        command.items,
      );

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<ReceivePOItemsResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

