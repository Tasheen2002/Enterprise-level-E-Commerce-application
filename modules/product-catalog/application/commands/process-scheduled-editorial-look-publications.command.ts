import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import {
  EditorialLookManagementService,
  ScheduledPublicationResult,
} from "../services/editorial-look-management.service";

export interface ProcessScheduledEditorialLookPublicationsCommand extends ICommand {}

export class ProcessScheduledEditorialLookPublicationsHandler implements ICommandHandler<ProcessScheduledEditorialLookPublicationsCommand, CommandResult<ScheduledPublicationResult>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(_command: ProcessScheduledEditorialLookPublicationsCommand): Promise<CommandResult<ScheduledPublicationResult>> {
    const result = await this.editorialLookManagementService.processScheduledPublications();
    return CommandResult.success(result);
  }
}
