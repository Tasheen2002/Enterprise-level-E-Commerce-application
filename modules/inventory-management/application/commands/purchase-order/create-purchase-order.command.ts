import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";

export interface CreatePurchaseOrderCommand extends ICommand {
  supplierId: string;
  eta?: Date;
}

export class CreatePurchaseOrderHandler implements ICommandHandler<
  CreatePurchaseOrderCommand,
  CommandResult<PurchaseOrder>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: CreatePurchaseOrderCommand,
  ): Promise<CommandResult<PurchaseOrder>> {
    try {
      const errors: string[] = [];

      if (!command.supplierId || command.supplierId.trim().length === 0) {
        errors.push("supplierId: Supplier ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<PurchaseOrder>(
          "Validation failed",
          errors,
        );
      }

      const purchaseOrder = await this.poService.createPurchaseOrder(
        command.supplierId,
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

