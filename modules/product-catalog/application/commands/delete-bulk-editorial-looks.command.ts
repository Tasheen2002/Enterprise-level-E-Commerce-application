import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import {
  EditorialLookManagementService,
  BatchDeleteResult,
} from "../services/editorial-look-management.service";

export interface DeleteBulkEditorialLooksCommand extends ICommand {
  readonly ids: string[];
}

export class DeleteBulkEditorialLooksHandler implements ICommandHandler<DeleteBulkEditorialLooksCommand, CommandResult<BatchDeleteResult>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: DeleteBulkEditorialLooksCommand): Promise<CommandResult<BatchDeleteResult>> {
    const result = await this.editorialLookManagementService.deleteMultipleEditorialLooks(command.ids);
    return CommandResult.success(result);
  }
}
