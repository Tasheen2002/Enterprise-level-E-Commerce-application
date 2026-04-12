import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder, PreorderDTO } from "../../domain/entities/preorder.entity";

export interface MarkPreorderNotifiedCommand extends ICommand {
  orderItemId: string;
}


export class MarkPreorderNotifiedCommandHandler implements ICommandHandler<
  MarkPreorderNotifiedCommand,
  CommandResult<PreorderDTO>
> {
  constructor(private preorderService: PreorderManagementService) {}

  async handle(
    command: MarkPreorderNotifiedCommand,
  ): Promise<CommandResult<PreorderDTO>> {
    // Service throws if not found
      const preorder = await this.preorderService.markAsNotified(
        command.orderItemId,
      );

      return CommandResult.success(Preorder.toDTO(preorder));
  }
}
