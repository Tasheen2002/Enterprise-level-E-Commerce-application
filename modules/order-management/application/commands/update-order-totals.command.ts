import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface UpdateOrderTotalsCommand extends ICommand {
  readonly orderId: string;
  readonly totals: {
    readonly tax: number;
    readonly shipping: number;
    readonly discount: number;
  };
}

export class UpdateOrderTotalsCommandHandler implements ICommandHandler<
  UpdateOrderTotalsCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateOrderTotalsCommand,
  ): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.updateOrderTotals(
      command.orderId,
      command.totals,
    );
    return CommandResult.success(order);
  }
}
