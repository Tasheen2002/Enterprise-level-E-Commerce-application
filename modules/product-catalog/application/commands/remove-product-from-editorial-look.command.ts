import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface RemoveProductFromEditorialLookCommand extends ICommand {
  readonly id: string;
  readonly productId: string;
}

export class RemoveProductFromEditorialLookHandler implements ICommandHandler<RemoveProductFromEditorialLookCommand, CommandResult<void>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: RemoveProductFromEditorialLookCommand): Promise<CommandResult<void>> {
    await this.editorialLookManagementService.removeProductFromLook(command.id, command.productId);
    return CommandResult.success(undefined);
  }
}
