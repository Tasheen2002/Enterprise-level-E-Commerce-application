import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface SetEditorialLookProductsCommand extends ICommand {
  readonly id: string;
  readonly productIds: string[];
}

export class SetEditorialLookProductsHandler implements ICommandHandler<SetEditorialLookProductsCommand, CommandResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: SetEditorialLookProductsCommand): Promise<CommandResult<EditorialLookDTO>> {
    const dto = await this.editorialLookManagementService.setLookProducts(command.id, command.productIds);
    return CommandResult.success(dto);
  }
}
