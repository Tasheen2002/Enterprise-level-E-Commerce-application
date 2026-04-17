import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface UpdatePOEtaCommand extends ICommand {
  readonly poId: string;
  readonly eta: Date;
}

export class UpdatePOEtaHandler implements ICommandHandler<
  UpdatePOEtaCommand,
  CommandResult<PurchaseOrderDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: UpdatePOEtaCommand): Promise<CommandResult<PurchaseOrderDTO>> {
    const purchaseOrder = await this.poService.updatePurchaseOrderEta(
      command.poId,
      command.eta,
    );
    return CommandResult.success(purchaseOrder);
  }
}
