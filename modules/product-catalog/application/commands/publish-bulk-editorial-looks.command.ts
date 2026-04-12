import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface PublishBulkEditorialLooksCommand extends ICommand {
  ids: string[];
}

export interface PublishBulkEditorialLooksResult {
  published: string[];
  failed: Array<{ id: string; error: string }>;
}

export class PublishBulkEditorialLooksHandler implements ICommandHandler<PublishBulkEditorialLooksCommand, CommandResult<PublishBulkEditorialLooksResult>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: PublishBulkEditorialLooksCommand): Promise<CommandResult<PublishBulkEditorialLooksResult>> {
    const result = await this.editorialLookManagementService.publishMultipleLooks(command.ids);
    return CommandResult.success(result);
  }
}
