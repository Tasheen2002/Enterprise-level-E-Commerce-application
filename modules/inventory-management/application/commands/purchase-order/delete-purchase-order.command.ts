import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface DeletePurchaseOrderInput extends ICommand {
  poId: string;
}

export class DeletePurchaseOrderHandler implements ICommandHandler<
  DeletePurchaseOrderInput,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: DeletePurchaseOrderInput): Promise<CommandResult<void>> {
    await this.poService.deletePurchaseOrder(input.poId);
    return CommandResult.success();
  }
}
