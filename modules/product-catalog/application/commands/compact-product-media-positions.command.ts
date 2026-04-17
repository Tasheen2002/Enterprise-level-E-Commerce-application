import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface CompactProductMediaPositionsCommand extends ICommand {
  readonly productId: string;
}

export class CompactProductMediaPositionsHandler implements ICommandHandler<CompactProductMediaPositionsCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: CompactProductMediaPositionsCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.compactProductMediaPositions(command.productId);
    return CommandResult.success(undefined);
  }
}
