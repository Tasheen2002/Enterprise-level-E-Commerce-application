import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface AssociateProductTagsCommand extends ICommand {
  readonly productId: string;
  readonly tagIds: string[];
}

export class AssociateProductTagsHandler implements ICommandHandler<AssociateProductTagsCommand, CommandResult<void>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: AssociateProductTagsCommand): Promise<CommandResult<void>> {
    await this.productTagManagementService.associateProductTags(command.productId, command.tagIds);
    return CommandResult.success(undefined);
  }
}
