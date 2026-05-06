import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import {
  EditorialLookManagementService,
  BatchPublishResult,
} from "../services/editorial-look-management.service";

export interface PublishBulkEditorialLooksCommand extends ICommand {
  readonly ids: string[];
}

export class PublishBulkEditorialLooksHandler implements ICommandHandler<PublishBulkEditorialLooksCommand, CommandResult<BatchPublishResult>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: PublishBulkEditorialLooksCommand): Promise<CommandResult<BatchPublishResult>> {
    const result = await this.editorialLookManagementService.publishMultipleLooks(command.ids);
    return CommandResult.success(result);
  }
}
