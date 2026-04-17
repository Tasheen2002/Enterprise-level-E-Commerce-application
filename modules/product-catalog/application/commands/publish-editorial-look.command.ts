import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface PublishEditorialLookCommand extends ICommand {
  readonly id: string;
}

export class PublishEditorialLookHandler implements ICommandHandler<PublishEditorialLookCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: PublishEditorialLookCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.publishLook(command.id);
    return CommandResult.success(dto);
  }
}
