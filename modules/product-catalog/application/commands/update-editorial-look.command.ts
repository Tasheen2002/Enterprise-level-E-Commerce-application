import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface UpdateEditorialLookCommand extends ICommand {
  readonly id: string;
  readonly title?: string;
  readonly storyHtml?: string;
  readonly heroAssetId?: string | null;
  readonly publishedAt?: Date | null;
}

export class UpdateEditorialLookHandler implements ICommandHandler<UpdateEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: UpdateEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    const { id, ...rest } = command;
    const dto = await this.editorialLookManagementService.updateEditorialLook(id, rest);
    return CommandResult.success(dto);
  }
}
