import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface MarkOrderPaidCommand extends ICommand {
  orderId: string;
}


export class MarkOrderPaidCommandHandler implements ICommandHandler<
  MarkOrderPaidCommand,
  CommandResult<OrderDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(command: MarkOrderPaidCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.markOrderAsPaid(command.orderId);

      return CommandResult.success(Order.toDTO(order));
  }
}
