import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService, ProductMediaReorderData } from "../services/product-media-management.service";

export interface ReorderProductMediaCommand extends ICommand {
  readonly productId: string;
  readonly reorderData: ProductMediaReorderData[];
}

export class ReorderProductMediaHandler implements ICommandHandler<ReorderProductMediaCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: ReorderProductMediaCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.reorderProductMedia(command.productId, command.reorderData);
    return CommandResult.success(undefined);
  }
}
