import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderDTO } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderItemDTO } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface CreatePurchaseOrderWithItemsInput extends ICommand {
  supplierId: string;
  eta?: Date;
  items: Array<{ variantId: string; orderedQty: number }>;
}

export interface CreatePurchaseOrderWithItemsResult {
  purchaseOrder: PurchaseOrderDTO;
  items: PurchaseOrderItemDTO[];
}

export class CreatePurchaseOrderWithItemsHandler implements ICommandHandler<
  CreatePurchaseOrderWithItemsInput,
  CommandResult<CreatePurchaseOrderWithItemsResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(
    input: CreatePurchaseOrderWithItemsInput,
  ): Promise<CommandResult<CreatePurchaseOrderWithItemsResult>> {
    const purchaseOrder = await this.poService.createPurchaseOrder(
      input.supplierId,
      input.eta,
    );

    const addedItems: PurchaseOrderItemDTO[] = [];
    for (const item of input.items) {
      const poItem = await this.poService.addPurchaseOrderItem(
        purchaseOrder.poId,
        item.variantId,
        item.orderedQty,
      );
      addedItems.push(poItem);
    }

    return CommandResult.success({ purchaseOrder, items: addedItems });
  }
}
