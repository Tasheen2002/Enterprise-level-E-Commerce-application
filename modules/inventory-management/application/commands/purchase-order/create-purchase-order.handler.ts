import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreatePurchaseOrderCommand } from "./create-purchase-order.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";

export class CreatePurchaseOrderHandler implements ICommandHandler<
  CreatePurchaseOrderCommand,
  CommandResult<PurchaseOrder>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: CreatePurchaseOrderCommand,
  ): Promise<CommandResult<PurchaseOrder>> {
    try {
      const purchaseOrder = await this.poService.createPurchaseOrder(
        command.supplierId,
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
