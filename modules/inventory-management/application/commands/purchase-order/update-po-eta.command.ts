import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";

export interface UpdatePOEtaCommand extends ICommand {
  poId: string;
  eta: Date;
}

export class UpdatePOEtaHandler implements ICommandHandler<
  UpdatePOEtaCommand,
  CommandResult<PurchaseOrder>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: UpdatePOEtaCommand,
  ): Promise<CommandResult<PurchaseOrder>> {
    try {
      const errors: string[] = [];

      if (!command.poId || command.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (!command.eta) {
        errors.push("eta: ETA date is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<PurchaseOrder>("Validation failed", errors);
      }

      const purchaseOrder = await this.poService.updatePurchaseOrderEta(
        command.poId,
        command.eta,
      );

      return CommandResult.success(purchaseOrder);
    } catch (error) {
      return CommandResult.failure<PurchaseOrder>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
