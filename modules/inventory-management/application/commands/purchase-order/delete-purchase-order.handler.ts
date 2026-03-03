import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeletePurchaseOrderCommand } from "./delete-purchase-order.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export class DeletePurchaseOrderHandler implements ICommandHandler<
  DeletePurchaseOrderCommand,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: DeletePurchaseOrderCommand,
  ): Promise<CommandResult<void>> {
    try {
      await this.poService.deletePurchaseOrder(command.poId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
