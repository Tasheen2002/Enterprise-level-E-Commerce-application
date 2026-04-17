import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface CreateEditorialLookCommand extends ICommand {
  readonly title: string;
  readonly storyHtml?: string;
  readonly heroAssetId?: string;
  readonly publishedAt?: Date;
  readonly productIds?: string[];
}

export class CreateEditorialLookHandler implements ICommandHandler<CreateEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: CreateEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.createEditorialLook(command);
    return CommandResult.success(dto);
  }
}
