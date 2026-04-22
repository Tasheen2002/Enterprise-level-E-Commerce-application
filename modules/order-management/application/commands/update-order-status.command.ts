import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface UpdateOrderStatusCommand extends ICommand {
  readonly orderId: string;
  readonly status: string;
}

export class UpdateOrderStatusHandler implements ICommandHandler<
  UpdateOrderStatusCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: UpdateOrderStatusCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.updateOrderStatus(command.orderId, command.status);
    return CommandResult.success(order);
  }
}
