import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO, CreateEditorialLookData } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface CreateBulkEditorialLooksCommand extends ICommand {
  looks: Array<{
    title: string;
    storyHtml?: string;
    heroAssetId?: string;
    publishedAt?: string;
    productIds?: string[];
  }>;
}

export class CreateBulkEditorialLooksHandler implements ICommandHandler<CreateBulkEditorialLooksCommand, CommandResult<EditorialLookDTO[]>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: CreateBulkEditorialLooksCommand): Promise<CommandResult<EditorialLookDTO[]>> {
    const createData: CreateEditorialLookData[] = command.looks.map((look) => ({
      title: look.title,
      storyHtml: look.storyHtml,
      heroAssetId: look.heroAssetId,
      publishedAt: look.publishedAt ? new Date(look.publishedAt) : undefined,
      productIds: look.productIds,
    }));
    const dtos = await this.editorialLookManagementService.createMultipleEditorialLooks(createData);
    return CommandResult.success(dtos);
  }
}
