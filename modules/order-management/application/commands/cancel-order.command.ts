import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface CancelOrderCommand extends ICommand {
  readonly orderId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}

export class CancelOrderHandler implements ICommandHandler<
  CancelOrderCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: CancelOrderCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.cancelOrder(
      command.orderId,
      command.requestingUserId,
      command.isStaff,
    );
    return CommandResult.success(order);
  }
}
