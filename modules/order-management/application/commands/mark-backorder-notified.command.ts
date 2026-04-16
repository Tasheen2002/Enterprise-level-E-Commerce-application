import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { BackorderDTO } from "../../domain/entities/backorder.entity";

export interface MarkBackorderNotifiedCommand extends ICommand {
  readonly orderItemId: string;
}

export class MarkBackorderNotifiedCommandHandler implements ICommandHandler<
  MarkBackorderNotifiedCommand,
  CommandResult<BackorderDTO>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(command: MarkBackorderNotifiedCommand): Promise<CommandResult<BackorderDTO>> {
    const backorder = await this.backorderService.markAsNotified(command.orderItemId);
    return CommandResult.success(backorder);
  }
}
