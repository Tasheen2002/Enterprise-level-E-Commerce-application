import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface MoveMediaPositionCommand extends ICommand {
  readonly productId: string;
  readonly assetId: string;
  readonly newPosition: number;
}

export class MoveMediaPositionHandler implements ICommandHandler<MoveMediaPositionCommand, CommandResult<void>> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(command: MoveMediaPositionCommand): Promise<CommandResult<void>> {
    await this.productMediaManagementService.moveMediaPosition(command.productId, command.assetId, command.newPosition);
    return CommandResult.success(undefined);
  }
}
