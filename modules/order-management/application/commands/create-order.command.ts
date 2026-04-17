import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

interface AddressInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly phone?: string;
  readonly email?: string;
}

export interface CreateOrderCommand extends ICommand {
  readonly userId?: string;
  readonly guestToken?: string;
  readonly items: Array<{
    readonly variantId: string;
    readonly quantity: number;
    readonly isGift?: boolean;
    readonly giftMessage?: string;
  }>;
  readonly shippingAddress: AddressInput;
  readonly billingAddress?: AddressInput;
  readonly source?: string;
  readonly currency: string;
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