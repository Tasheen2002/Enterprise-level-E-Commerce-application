import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";

export interface UpdatePOStatusCommand extends ICommand {
  poId: string;
  status: string;
}

export class UpdatePOStatusHandler implements ICommandHandler<
  UpdatePOStatusCommand,
  CommandResult<PurchaseOrder>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: UpdatePOStatusCommand,
  ): Promise<CommandResult<PurchaseOrder>> {
    try {
      const errors: string[] = [];

      if (!command.poId || command.poId.trim().length === 0) {
        errors.push("poId: Purchase Order ID is required");
      }

      if (!command.status || command.status.trim().length === 0) {
        errors.push("status: Status is required");
      }

      const validStatuses = [
        "draft",
        "sent",
        "part_received",
        "received",
        "cancelled",
      ];
      if (
        command.status &&
        !validStatuses.includes(command.status.toLowerCase())
      ) {
        errors.push(
          "status: Status must be one of: draft, sent, part_received, received, cancelled",
        );
      }

      if (errors.length > 0) {
        return CommandResult.failure<PurchaseOrder>(
          "Validation failed",
          errors,
        );
      }

      const purchaseOrder = await this.poService.updatePurchaseOrderStatus(
        command.poId,
        command.status,
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

