import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface ScheduleEditorialLookPublicationCommand extends ICommand {
  id: string;
  publishDate: string;
}

export class ScheduleEditorialLookPublicationHandler implements ICommandHandler<ScheduleEditorialLookPublicationCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: ScheduleEditorialLookPublicationCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.scheduleLookPublication(command.id, new Date(command.publishDate));
    return CommandResult.success(dto);
  }
}
