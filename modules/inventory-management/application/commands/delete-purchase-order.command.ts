import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface DeletePurchaseOrderCommand extends ICommand {
  readonly poId: string;
}

export class DeletePurchaseOrderHandler implements ICommandHandler<
  DeletePurchaseOrderCommand,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: DeletePurchaseOrderCommand): Promise<CommandResult<void>> {
    await this.poService.deletePurchaseOrder(command.poId);
    return CommandResult.success();
  }
}
