import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdatePOEtaCommand } from "./update-po-eta.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";

export class UpdatePOEtaHandler implements ICommandHandler<
  UpdatePOEtaCommand,
  CommandResult<PurchaseOrder>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: UpdatePOEtaCommand,
  ): Promise<CommandResult<PurchaseOrder>> {
    try {
      const purchaseOrder = await this.poService.updatePurchaseOrderEta(
        command.poId,
        command.eta,
      );

      return CommandResult.success(purchaseOrder);
    } catch (error) {
      return CommandResult.failure<PurchaseOrder>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
