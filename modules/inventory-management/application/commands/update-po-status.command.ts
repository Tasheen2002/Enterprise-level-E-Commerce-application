import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface UpdatePOStatusCommand extends ICommand {
  readonly poId: string;
  readonly status: string;
}

export class UpdatePOStatusHandler implements ICommandHandler<
  UpdatePOStatusCommand,
  CommandResult<PurchaseOrderDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: UpdatePOStatusCommand): Promise<CommandResult<PurchaseOrderDTO>> {
    const purchaseOrder = await this.poService.updatePurchaseOrderStatus(
      command.poId,
      command.status,
    );
    return CommandResult.success(purchaseOrder);
  }
}
