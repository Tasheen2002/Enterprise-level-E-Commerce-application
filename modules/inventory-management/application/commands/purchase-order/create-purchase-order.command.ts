import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderDTO } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface CreatePurchaseOrderInput extends ICommand {
  supplierId: string;
  eta?: Date;
}

export class CreatePurchaseOrderHandler implements ICommandHandler<
  CreatePurchaseOrderInput,
  CommandResult<PurchaseOrderDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: CreatePurchaseOrderInput): Promise<CommandResult<PurchaseOrderDTO>> {
    const purchaseOrder = await this.poService.createPurchaseOrder(
      input.supplierId,
      input.eta,
    );
    return CommandResult.success(purchaseOrder);
  }
}
