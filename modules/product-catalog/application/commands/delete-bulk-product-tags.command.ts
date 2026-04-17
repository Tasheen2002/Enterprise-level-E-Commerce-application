import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface DeleteBulkProductTagsCommand extends ICommand {
  readonly ids: string[];
}

export class DeleteBulkProductTagsHandler implements ICommandHandler<DeleteBulkProductTagsCommand, CommandResult<void>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: DeleteBulkProductTagsCommand): Promise<CommandResult<void>> {
    await this.productTagManagementService.deleteMultipleTags(command.ids);
    return CommandResult.success(undefined);
  }
}
