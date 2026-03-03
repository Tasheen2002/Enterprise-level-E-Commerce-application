import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdatePOStatusCommand } from "./update-po-status.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";

export class UpdatePOStatusHandler implements ICommandHandler<
  UpdatePOStatusCommand,
  CommandResult<PurchaseOrder>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: UpdatePOStatusCommand,
  ): Promise<CommandResult<PurchaseOrder>> {
    try {
      const purchaseOrder = await this.poService.updatePurchaseOrderStatus(
        command.poId,
        command.status,
      );

      return CommandResult.success(purchaseOrder);
    } catch (error) {
      return CommandResult.failure<PurchaseOrder>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
