import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderDTO } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface UpdatePOEtaInput extends ICommand {
  poId: string;
  eta: Date;
}

export class UpdatePOEtaHandler implements ICommandHandler<
  UpdatePOEtaInput,
  CommandResult<PurchaseOrderDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: UpdatePOEtaInput): Promise<CommandResult<PurchaseOrderDTO>> {
    const purchaseOrder = await this.poService.updatePurchaseOrderEta(
      input.poId,
      input.eta,
    );
    return CommandResult.success(purchaseOrder);
  }
}
