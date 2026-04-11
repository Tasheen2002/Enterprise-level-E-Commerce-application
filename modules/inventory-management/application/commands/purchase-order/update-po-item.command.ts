import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderItemDTO } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface UpdatePOItemInput extends ICommand {
  poId: string;
  variantId: string;
  orderedQty: number;
}

export class UpdatePOItemHandler implements ICommandHandler<
  UpdatePOItemInput,
  CommandResult<PurchaseOrderItemDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: UpdatePOItemInput): Promise<CommandResult<PurchaseOrderItemDTO>> {
    const item = await this.poService.updatePurchaseOrderItem(
      input.poId,
      input.variantId,
      input.orderedQty,
    );
    return CommandResult.success(item);
  }
}
