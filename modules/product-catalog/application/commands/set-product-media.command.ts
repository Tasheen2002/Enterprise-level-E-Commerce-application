import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService, ProductMediaData } from "../services/product-media-management.service";

export interface SetProductMediaCommand extends ICommand {
  readonly productId: string;
  readonly mediaData: ProductMediaData[];
}

export class SetProductMediaHandler implements ICommandHandler<SetProductMediaCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: SetProductMediaCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.setProductMedia(command.productId, command.mediaData);
    return CommandResult.success(undefined);
  }
}
