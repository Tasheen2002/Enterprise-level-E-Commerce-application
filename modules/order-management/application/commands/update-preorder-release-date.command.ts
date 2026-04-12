import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder, PreorderDTO } from "../../domain/entities/preorder.entity";

export interface UpdatePreorderReleaseDateCommand extends ICommand {
  orderItemId: string;
  releaseDate: Date;
}


export class UpdatePreorderReleaseDateCommandHandler implements ICommandHandler<
  UpdatePreorderReleaseDateCommand,
  CommandResult<PreorderDTO>
> {
  constructor(private preorderService: PreorderManagementService) {}

  async handle(
    command: UpdatePreorderReleaseDateCommand,
  ): Promise<CommandResult<PreorderDTO>> {
    // Service throws if not found
      const preorder = await this.preorderService.updateReleaseDate(
        command.orderItemId,
        command.releaseDate,
      );

      return CommandResult.success(Preorder.toDTO(preorder));
  }
}
