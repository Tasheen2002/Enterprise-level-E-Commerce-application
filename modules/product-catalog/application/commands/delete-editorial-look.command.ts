import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface DeleteEditorialLookCommand extends ICommand {
  readonly id: string;
}

export class DeleteEditorialLookHandler implements ICommandHandler<DeleteEditorialLookCommand, CommandResult<void>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: DeleteEditorialLookCommand): Promise<CommandResult<void>> {
    await this.editorialLookManagementService.deleteEditorialLook(command.id);
    return CommandResult.success(undefined);
  }
}
