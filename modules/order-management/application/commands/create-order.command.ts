import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

interface AddressInput {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CreateOrderCommand extends ICommand {
  userId?: string;
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput;
  source?: string;
  currency: string;
}

export class CreateOrderCommandHandler implements ICommandHandler<
  CreateOrderCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: CreateOrderCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.createOrder({
      userId: command.userId,
      guestToken: command.guestToken,
      items: command.items,
      shippingAddress: command.shippingAddress,
      billingAddress: command.billingAddress,
      source: command.source,
      currency: command.currency,
    });
    return CommandResult.success(order);
  }
}
