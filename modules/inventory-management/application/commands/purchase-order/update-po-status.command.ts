import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderDTO } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface UpdatePOStatusInput extends ICommand {
  poId: string;
  status: string;
}

export class UpdatePOStatusHandler implements ICommandHandler<
  UpdatePOStatusInput,
  CommandResult<PurchaseOrderDTO>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: UpdatePOStatusInput): Promise<CommandResult<PurchaseOrderDTO>> {
    const purchaseOrder = await this.poService.updatePurchaseOrderStatus(
      input.poId,
      input.status,
    );
    return CommandResult.success(purchaseOrder);
  }
}
