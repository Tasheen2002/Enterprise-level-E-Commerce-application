import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface RemoveProductTagAssociationCommand extends ICommand {
  readonly productId: string;
  readonly tagId: string;
}

export class RemoveProductTagAssociationHandler implements ICommandHandler<RemoveProductTagAssociationCommand, CommandResult<void>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: RemoveProductTagAssociationCommand): Promise<CommandResult<void>> {
    await this.productTagManagementService.removeProductTag(command.productId, command.tagId);
    return CommandResult.success(undefined);
  }
}
