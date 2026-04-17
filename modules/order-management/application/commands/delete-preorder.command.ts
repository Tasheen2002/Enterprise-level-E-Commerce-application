import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";

export interface DeletePreorderCommand extends ICommand {
  readonly orderItemId: string;
}

export class DeletePreorderCommandHandler implements ICommandHandler<
  DeletePreorderCommand,
  CommandResult<void>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(command: DeletePreorderCommand): Promise<CommandResult<void>> {
    await this.preorderService.deletePreorder(command.orderItemId);
    return CommandResult.success(undefined);
  }
}
