import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface DeleteProductTagCommand extends ICommand {
  readonly id: string;
}

export class DeleteProductTagHandler implements ICommandHandler<DeleteProductTagCommand, CommandResult<void>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: DeleteProductTagCommand): Promise<CommandResult<void>> {
    await this.productTagManagementService.deleteTag(command.id);
    return CommandResult.success(undefined);
  }
}
