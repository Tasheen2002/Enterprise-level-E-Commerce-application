import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface RemoveCoverImageCommand extends ICommand {
  readonly productId: string;
}

export class RemoveCoverImageHandler implements ICommandHandler<RemoveCoverImageCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: RemoveCoverImageCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.removeCoverImage(command.productId);
    return CommandResult.success(undefined);
  }
}
