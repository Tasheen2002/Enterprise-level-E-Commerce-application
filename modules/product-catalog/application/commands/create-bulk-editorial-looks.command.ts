import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface CreateBulkEditorialLooksCommand extends ICommand {
  readonly looks: Array<{
    readonly title: string;
    readonly storyHtml?: string;
    readonly heroAssetId?: string;
    readonly publishedAt?: Date;
    readonly productIds?: string[];
  }>;
}

export class CreateBulkEditorialLooksHandler implements ICommandHandler<
  CreateBulkEditorialLooksCommand,
  CommandResult<EditorialLookDTO[]>
> {
  constructor(
    private readonly editorialLookManagementService: EditorialLookManagementService,
  ) {}

  async handle(
    command: CreateBulkEditorialLooksCommand,
  ): Promise<CommandResult<EditorialLookDTO[]>> {
    const dtos =
      await this.editorialLookManagementService.createMultipleEditorialLooks(
        command.looks,
      );
    return CommandResult.success(dtos);
  }
}
