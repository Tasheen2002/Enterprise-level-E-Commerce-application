import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { BackorderDTO } from "../../domain/entities/backorder.entity";

export interface CreateBackorderCommand extends ICommand {
  readonly orderItemId: string;
  readonly promisedEta?: Date;
}

export class CreateBackorderCommandHandler implements ICommandHandler<
  CreateBackorderCommand,
  CommandResult<BackorderDTO>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(command: CreateBackorderCommand): Promise<CommandResult<BackorderDTO>> {
    const backorder = await this.backorderService.createBackorder({
      orderItemId: command.orderItemId,
      promisedEta: command.promisedEta,
    });
    return CommandResult.success(backorder);
  }
}
