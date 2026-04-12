import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO, CreateEditorialLookData } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface CreateEditorialLookCommand extends ICommand {
  title: string;
  storyHtml?: string;
  heroAssetId?: string;
  publishedAt?: string;
  productIds?: string[];
}

export class CreateEditorialLookHandler implements ICommandHandler<CreateEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: CreateEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    const createData: CreateEditorialLookData = {
      title: command.title,
      storyHtml: command.storyHtml,
      heroAssetId: command.heroAssetId,
      publishedAt: command.publishedAt ? new Date(command.publishedAt) : undefined,
      productIds: command.productIds,
    };
    const dto = await this.editorialLookManagementService.createEditorialLook(createData);
    return CommandResult.success(dto);
  }
}
