import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface UpdateEditorialLookStoryContentCommand extends ICommand {
  readonly id: string;
  readonly storyHtml: string;
}

export class UpdateEditorialLookStoryContentHandler implements ICommandHandler<UpdateEditorialLookStoryContentCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: UpdateEditorialLookStoryContentCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.updateStoryContent(command.id, command.storyHtml);
    return CommandResult.success(dto);
  }
}
