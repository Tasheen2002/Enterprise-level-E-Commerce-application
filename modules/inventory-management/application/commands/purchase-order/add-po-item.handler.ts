import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AddPOItemCommand } from "./add-po-item.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";

export class AddPOItemHandler implements ICommandHandler<
  AddPOItemCommand,
  CommandResult<PurchaseOrderItem>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: AddPOItemCommand,
  ): Promise<CommandResult<PurchaseOrderItem>> {
    try {
      const item = await this.poService.addPurchaseOrderItem(
        command.poId,
        command.variantId,
        command.orderedQty,
      );

      return CommandResult.success(item);
    } catch (error) {
      return CommandResult.failure<PurchaseOrderItem>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
