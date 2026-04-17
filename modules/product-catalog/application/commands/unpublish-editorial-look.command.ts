import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface UnpublishEditorialLookCommand extends ICommand {
  readonly id: string;
}

export class UnpublishEditorialLookHandler implements ICommandHandler<UnpublishEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: UnpublishEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.unpublishLook(command.id);
    return CommandResult.success(dto);
  }
}
