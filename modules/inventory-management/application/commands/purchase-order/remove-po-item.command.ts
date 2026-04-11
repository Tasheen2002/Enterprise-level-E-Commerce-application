import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface RemovePOItemInput extends ICommand {
  poId: string;
  variantId: string;
}

export class RemovePOItemHandler implements ICommandHandler<
  RemovePOItemInput,
  CommandResult<void>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(input: RemovePOItemInput): Promise<CommandResult<void>> {
    await this.poService.removePurchaseOrderItem(input.poId, input.variantId);
    return CommandResult.success();
  }
}
