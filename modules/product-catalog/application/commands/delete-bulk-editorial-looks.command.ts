import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface DeleteBulkEditorialLooksCommand extends ICommand {
  readonly ids: string[];
}

export class DeleteBulkEditorialLooksHandler implements ICommandHandler<DeleteBulkEditorialLooksCommand, CommandResult<void>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: DeleteBulkEditorialLooksCommand): Promise<CommandResult<void>> {
    await this.editorialLookManagementService.deleteMultipleEditorialLooks(command.ids);
    return CommandResult.success(undefined);
  }
}
