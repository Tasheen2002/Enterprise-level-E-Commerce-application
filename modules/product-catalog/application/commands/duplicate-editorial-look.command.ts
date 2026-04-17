import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface DuplicateEditorialLookCommand extends ICommand {
  readonly id: string;
  readonly newTitle: string;
}

export class DuplicateEditorialLookHandler implements ICommandHandler<DuplicateEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: DuplicateEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.duplicateEditorialLook(command.id, command.newTitle);
    return CommandResult.success(dto);
  }
}
