import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface ProcessScheduledEditorialLookPublicationsCommand extends ICommand {}

export interface ProcessScheduledPublicationsResult {
  readonly published: EditorialLookDTO[];
  readonly errors: string[];
}

export class ProcessScheduledEditorialLookPublicationsHandler implements ICommandHandler<ProcessScheduledEditorialLookPublicationsCommand, CommandResult<ProcessScheduledPublicationsResult>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(_command: ProcessScheduledEditorialLookPublicationsCommand): Promise<CommandResult<ProcessScheduledPublicationsResult>> {
    const result = await this.editorialLookManagementService.processScheduledPublications();
    return CommandResult.success(result);
  }
}
