import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";
import { OrderTotalsData } from "../../domain/value-objects/order-totals.vo";

export interface UpdateOrderTotalsCommand extends ICommand {
  readonly orderId: string;
  readonly totals: Readonly<Pick<OrderTotalsData, "tax" | "shipping" | "discount">>;
}

export class UpdateOrderTotalsHandler implements ICommandHandler<
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
