import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderItemDTO } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface AddPOItemInput extends ICommand {
  poId: string;
  variantId: string;
  orderedQty: number;
}

export class AddPOItemHandler implements ICommandHandler<
  AddPOItemInput,
  CommandResult<PurchaseOrderItemDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: AddPOItemInput): Promise<CommandResult<PurchaseOrderItemDTO>> {
    const item = await this.poService.addPurchaseOrderItem(
      input.poId,
      input.variantId,
      input.orderedQty,
    );
    return CommandResult.success(item);
  }
}
