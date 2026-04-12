import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface RemoveMediaFromProductCommand extends ICommand {
  productId: string;
  assetId: string;
}

export class RemoveMediaFromProductHandler implements ICommandHandler<RemoveMediaFromProductCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: RemoveMediaFromProductCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.removeMediaFromProduct(command.productId, command.assetId);
    return CommandResult.success(undefined);
  }
}
