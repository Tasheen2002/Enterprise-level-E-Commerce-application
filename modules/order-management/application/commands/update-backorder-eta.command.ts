import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder, BackorderDTO } from "../../domain/entities/backorder.entity";

export interface UpdateBackorderEtaCommand extends ICommand {
  orderItemId: string;
  promisedEta: Date;
}


export class UpdateBackorderEtaCommandHandler implements ICommandHandler<
  UpdateBackorderEtaCommand,
  CommandResult<BackorderDTO>
> {
  constructor(private backorderService: BackorderManagementService) {}

  async handle(
    command: UpdateBackorderEtaCommand,
  ): Promise<CommandResult<BackorderDTO>> {
    // Service throws if not found
      const backorder = await this.backorderService.updatePromisedEta(
        command.orderItemId,
        command.promisedEta,
      );

      return CommandResult.success(Backorder.toDTO(backorder));
  }
}
