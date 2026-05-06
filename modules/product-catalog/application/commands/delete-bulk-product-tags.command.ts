import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import {
  ProductTagManagementService,
  BatchDeleteProductTagsResult,
} from "../services/product-tag-management.service";

export interface DeleteBulkProductTagsCommand extends ICommand {
  readonly ids: string[];
}

export class DeleteBulkProductTagsHandler implements ICommandHandler<DeleteBulkProductTagsCommand, CommandResult<BatchDeleteProductTagsResult>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: DeleteBulkProductTagsCommand): Promise<CommandResult<BatchDeleteProductTagsResult>> {
    const result = await this.productTagManagementService.deleteMultipleTags(command.ids);
    return CommandResult.success(result);
  }
}
