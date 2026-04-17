import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface DuplicateProductMediaCommand extends ICommand {
  readonly sourceProductId: string;
  readonly targetProductId: string;
}

export class DuplicateProductMediaHandler implements ICommandHandler<DuplicateProductMediaCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: DuplicateProductMediaCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.duplicateProductMedia(command.sourceProductId, command.targetProductId);
    return CommandResult.success(undefined);
  }
}
