import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderItemDTO } from "../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface AddPOItemCommand extends ICommand {
  readonly poId: string;
  readonly variantId: string;
  readonly orderedQty: number;
}

export class AddPOItemHandler implements ICommandHandler<
  AddPOItemCommand,
  CommandResult<PurchaseOrderItemDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: AddPOItemCommand): Promise<CommandResult<PurchaseOrderItemDTO>> {
    const item = await this.poService.addPurchaseOrderItem(
      command.poId,
      command.variantId,
      command.orderedQty,
    );
    return CommandResult.success(item);
  }
}
