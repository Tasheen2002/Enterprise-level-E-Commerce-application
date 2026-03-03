import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface DeletePurchaseOrderCommand extends ICommand {
  poId: string;
}

export class DeletePurchaseOrderHandler implements ICommandHandler<
  DeletePurchaseOrderCommand,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: DeletePurchaseOrderCommand,
  ): Promise<CommandResult<void>> {
    try {
      const errors: string[] = [];

      if (!command.poId || command.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<void>("Validation failed", errors);
      }

      await this.poService.deletePurchaseOrder(command.poId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

