import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";

export interface DeleteBackorderCommand extends ICommand {
  readonly orderItemId: string;
}

export class DeleteBackorderHandler implements ICommandHandler<
  DeleteBackorderCommand,
  CommandResult<void>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(command: DeleteBackorderCommand): Promise<CommandResult<void>> {
    await this.backorderService.deleteBackorder(command.orderItemId);
    return CommandResult.success(undefined);
  }
}
