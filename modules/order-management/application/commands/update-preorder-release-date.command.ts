import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { PreorderDTO } from "../../domain/entities/preorder.entity";

export interface UpdatePreorderReleaseDateCommand extends ICommand {
  readonly orderItemId: string;
  readonly releaseDate: Date;
}

export class UpdatePreorderReleaseDateCommandHandler implements ICommandHandler<
  UpdatePreorderReleaseDateCommand,
  CommandResult<PreorderDTO>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(command: UpdatePreorderReleaseDateCommand): Promise<CommandResult<PreorderDTO>> {
    const preorder = await this.preorderService.updateReleaseDate(
      command.orderItemId,
      command.releaseDate,
    );
    return CommandResult.success(preorder);
  }
}
