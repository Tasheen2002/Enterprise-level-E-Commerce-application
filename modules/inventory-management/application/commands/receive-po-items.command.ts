import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderItemDTO } from "../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface ReceivePOItemsCommand extends ICommand {
  readonly poId: string;
  readonly locationId: string;
  readonly items: { variantId: string; receivedQty: number }[];
}

export interface ReceivePOItemsResult {
  readonly purchaseOrder: PurchaseOrderDTO;
  readonly items: PurchaseOrderItemDTO[];
}

export class ReceivePOItemsHandler implements ICommandHandler<
  ReceivePOItemsCommand,
  CommandResult<ReceivePOItemsResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: ReceivePOItemsCommand): Promise<CommandResult<ReceivePOItemsResult>> {
    const result = await this.poService.receivePurchaseOrderItems(
      command.poId,
      command.locationId,
      command.items,
    );
    return CommandResult.success(result);
  }
}
