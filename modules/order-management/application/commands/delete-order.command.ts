import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";

export interface DeleteOrderCommand extends ICommand {
  readonly orderId: string;
}

export class DeleteOrderHandler implements ICommandHandler<
  DeleteOrderCommand,
  CommandResult<void>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: DeleteOrderCommand): Promise<CommandResult<void>> {
    await this.orderService.deleteOrder(command.orderId);
    return CommandResult.success(undefined);
  }
}
