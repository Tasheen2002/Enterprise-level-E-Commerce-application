import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { PreorderDTO } from "../../domain/entities/preorder.entity";

export interface CreatePreorderCommand extends ICommand {
  readonly orderItemId: string;
  readonly releaseDate?: Date;
}

export class CreatePreorderHandler implements ICommandHandler<
  CreatePreorderCommand,
  CommandResult<PreorderDTO>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(command: CreatePreorderCommand): Promise<CommandResult<PreorderDTO>> {
    const preorder = await this.preorderService.createPreorder({
      orderItemId: command.orderItemId,
      releaseDate: command.releaseDate,
    });
    return CommandResult.success(preorder);
  }
}
