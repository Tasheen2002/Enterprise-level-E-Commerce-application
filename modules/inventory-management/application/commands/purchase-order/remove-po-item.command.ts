import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface RemovePOItemCommand extends ICommand {
  poId: string;
  variantId: string;
}

export class RemovePOItemHandler implements ICommandHandler<
  RemovePOItemCommand,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: RemovePOItemCommand): Promise<CommandResult<void>> {
    try {
      const errors: string[] = [];

      if (!command.poId || command.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<void>("Validation failed", errors);
      }

      await this.poService.removePurchaseOrderItem(
        command.poId,
        command.variantId,
      );

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

