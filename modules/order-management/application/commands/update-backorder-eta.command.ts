import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { BackorderDTO } from "../../domain/entities/backorder.entity";

export interface UpdateBackorderEtaCommand extends ICommand {
  readonly orderItemId: string;
  readonly promisedEta: Date;
}

export class UpdateBackorderEtaHandler implements ICommandHandler<
  UpdateBackorderEtaCommand,
  CommandResult<BackorderDTO>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(command: UpdateBackorderEtaCommand): Promise<CommandResult<BackorderDTO>> {
    const backorder = await this.backorderService.updatePromisedEta(
      command.orderItemId,
      command.promisedEta,
    );
    return CommandResult.success(backorder);
  }
}
