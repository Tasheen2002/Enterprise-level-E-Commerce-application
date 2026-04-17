import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderItemDTO } from "../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface UpdatePOItemCommand extends ICommand {
  readonly poId: string;
  readonly variantId: string;
  readonly orderedQty: number;
}

export class UpdatePOItemHandler implements ICommandHandler<
  UpdatePOItemCommand,
  CommandResult<PurchaseOrderItemDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: UpdatePOItemCommand): Promise<CommandResult<PurchaseOrderItemDTO>> {
    const item = await this.poService.updatePurchaseOrderItem(
      command.poId,
      command.variantId,
      command.orderedQty,
    );
    return CommandResult.success(item);
  }
}
