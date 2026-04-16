import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface CreatePurchaseOrderCommand extends ICommand {
  readonly supplierId: string;
  readonly eta?: Date;
}

export class CreatePurchaseOrderHandler implements ICommandHandler<
  CreatePurchaseOrderCommand,
  CommandResult<PurchaseOrderDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(command: CreatePurchaseOrderCommand): Promise<CommandResult<PurchaseOrderDTO>> {
    const purchaseOrder = await this.poService.createPurchaseOrder(
      command.supplierId,
      command.eta,
    );
    return CommandResult.success(purchaseOrder);
  }
}
