import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface RemoveAllProductMediaCommand extends ICommand {
  readonly productId: string;
}

export class RemoveAllProductMediaHandler implements ICommandHandler<RemoveAllProductMediaCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: RemoveAllProductMediaCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.removeAllProductMedia(command.productId);
    return CommandResult.success(undefined);
  }
}
