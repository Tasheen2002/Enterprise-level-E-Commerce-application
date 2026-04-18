import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { PreorderDTO } from "../../domain/entities/preorder.entity";

export interface MarkPreorderNotifiedCommand extends ICommand {
  readonly orderItemId: string;
}

export class MarkPreorderNotifiedHandler implements ICommandHandler<
  MarkPreorderNotifiedCommand,
  CommandResult<PreorderDTO>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(command: MarkPreorderNotifiedCommand): Promise<CommandResult<PreorderDTO>> {
    const preorder = await this.preorderService.markAsNotified(command.orderItemId);
    return CommandResult.success(preorder);
  }
}
