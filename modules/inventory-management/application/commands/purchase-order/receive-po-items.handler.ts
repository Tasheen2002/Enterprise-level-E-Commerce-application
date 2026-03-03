import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import {
  ReceivePOItemsCommand,
  ReceivePOItemsResult,
} from "./receive-po-items.command";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export class ReceivePOItemsHandler implements ICommandHandler<
  ReceivePOItemsCommand,
  CommandResult<ReceivePOItemsResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    command: ReceivePOItemsCommand,
  ): Promise<CommandResult<ReceivePOItemsResult>> {
    try {
      const result = await this.poService.receivePurchaseOrderItems(
        command.poId,
        command.locationId,
        command.items,
      );

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<ReceivePOItemsResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
