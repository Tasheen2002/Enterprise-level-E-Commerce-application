import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { RemovePOItemCommand } from "./remove-po-item.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export class RemovePOItemHandler implements ICommandHandler<
  RemovePOItemCommand,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: RemovePOItemCommand): Promise<CommandResult<void>> {
    try {
      await this.poService.removePurchaseOrderItem(
        command.poId,
        command.variantId,
      );

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
