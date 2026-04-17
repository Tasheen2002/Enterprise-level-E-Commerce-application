import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface SetEditorialLookHeroImageCommand extends ICommand {
  readonly id: string;
  readonly assetId: string;
}

export class SetEditorialLookHeroImageHandler implements ICommandHandler<SetEditorialLookHeroImageCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: SetEditorialLookHeroImageCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.setHeroImage(command.id, command.assetId);
    return CommandResult.success(dto);
  }
}
