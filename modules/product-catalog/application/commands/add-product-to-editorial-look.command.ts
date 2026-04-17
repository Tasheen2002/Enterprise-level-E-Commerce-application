import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface AddProductToEditorialLookCommand extends ICommand {
  readonly id: string;
  readonly productId: string;
}

export class AddProductToEditorialLookHandler implements ICommandHandler<AddProductToEditorialLookCommand, CommandResult<void>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: AddProductToEditorialLookCommand): Promise<CommandResult<void>> {
    await this.editorialLookManagementService.addProductToLook(command.id, command.productId);
    return CommandResult.success(undefined);
  }
}
