import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderDTO } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderItemDTO } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface ReceivePOItemsInput extends ICommand {
  poId: string;
  locationId: string;
  items: { variantId: string; receivedQty: number }[];
}

export interface ReceivePOItemsResult {
  purchaseOrder: PurchaseOrderDTO;
  items: PurchaseOrderItemDTO[];
}

export class ReceivePOItemsHandler implements ICommandHandler<
  ReceivePOItemsInput,
  CommandResult<ReceivePOItemsResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: ReceivePOItemsInput): Promise<CommandResult<ReceivePOItemsResult>> {
    const result = await this.poService.receivePurchaseOrderItems(
      input.poId,
      input.locationId,
      input.items,
    );
    return CommandResult.success(result);
  }
}
