import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface UpdateEditorialLookCommand extends ICommand {
  id: string;
  title?: string;
  storyHtml?: string;
  heroAssetId?: string | null;
  publishedAt?: string | null;
}

export class UpdateEditorialLookHandler implements ICommandHandler<UpdateEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: UpdateEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    let resolvedPublishedAt: Date | null | undefined;
    if (command.publishedAt !== undefined) {
      resolvedPublishedAt = command.publishedAt === null ? null : new Date(command.publishedAt);
    }
    const dto = await this.editorialLookManagementService.updateEditorialLook(command.id, {
      title: command.title,
      storyHtml: command.storyHtml,
      heroAssetId: command.heroAssetId,
      publishedAt: resolvedPublishedAt,
    });
    return CommandResult.success(dto);
  }
}
