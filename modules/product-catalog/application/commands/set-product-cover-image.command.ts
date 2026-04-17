import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface SetProductCoverImageCommand extends ICommand {
  readonly productId: string;
  readonly assetId: string;
}

export class SetProductCoverImageHandler implements ICommandHandler<SetProductCoverImageCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: SetProductCoverImageCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.setProductCoverImage(command.productId, command.assetId);
    return CommandResult.success(undefined);
  }
}
