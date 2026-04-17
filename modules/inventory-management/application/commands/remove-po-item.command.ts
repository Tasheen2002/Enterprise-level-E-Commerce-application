import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface RemovePOItemCommand extends ICommand {
  readonly poId: string;
  readonly variantId: string;
}

export class RemovePOItemHandler implements ICommandHandler<
  RemovePOItemCommand,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: RemovePOItemCommand): Promise<CommandResult<void>> {
    await this.poService.removePurchaseOrderItem(command.poId, command.variantId);
    return CommandResult.success();
  }
}
