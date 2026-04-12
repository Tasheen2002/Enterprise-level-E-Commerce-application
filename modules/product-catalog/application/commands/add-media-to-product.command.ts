import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface AddMediaToProductCommand extends ICommand {
  productId: string;
  assetId: string;
  position?: number;
  isCover?: boolean;
}

export class AddMediaToProductHandler implements ICommandHandler<AddMediaToProductCommand, CommandResult<{ productMediaId: string }>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: AddMediaToProductCommand): Promise<CommandResult<{ productMediaId: string }>> {
    const productMediaId = await this.productMediaManagementService.addMediaToProduct(
      command.productId,
      command.assetId,
      command.position,
      command.isCover,
    );
    return CommandResult.success({ productMediaId });
  }
}
