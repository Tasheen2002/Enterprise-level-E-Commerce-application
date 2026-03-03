import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";

export interface UpdatePOItemCommand extends ICommand {
  poId: string;
  variantId: string;
  orderedQty: number;
}

export class UpdatePOItemHandler implements ICommandHandler<
  UpdatePOItemCommand,
  CommandResult<PurchaseOrderItem>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: UpdatePOItemCommand,
  ): Promise<CommandResult<PurchaseOrderItem>> {
    try {
      const errors: string[] = [];

      if (!command.poId || command.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.orderedQty || command.orderedQty <= 0) {
        errors.push("orderedQty: Ordered quantity must be greater than 0");
      }

      if (errors.length > 0) {
        return CommandResult.failure<PurchaseOrderItem>(
          "Validation failed",
          errors,
        );
      }

      const item = await this.poService.updatePurchaseOrderItem(
        command.poId,
        command.variantId,
        command.orderedQty,
      );

      return CommandResult.success(item);
    } catch (error) {
      return CommandResult.failure<PurchaseOrderItem>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

