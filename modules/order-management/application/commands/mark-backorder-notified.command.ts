import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder, BackorderDTO } from "../../domain/entities/backorder.entity";

export interface MarkBackorderNotifiedCommand extends ICommand {
  orderItemId: string;
}


export class MarkBackorderNotifiedCommandHandler implements ICommandHandler<
  MarkBackorderNotifiedCommand,
  CommandResult<BackorderDTO>
> {
  constructor(private backorderService: BackorderManagementService) {}

  async handle(
    command: MarkBackorderNotifiedCommand,
  ): Promise<CommandResult<BackorderDTO>> {
    // Service throws if not found
      const backorder = await this.backorderService.markAsNotified(
        command.orderItemId,
      );

      return CommandResult.success(Backorder.toDTO(backorder));
  }
}
