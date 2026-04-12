import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CheckoutOrderService, OrderResult } from "../services/checkout-order.service";

export interface CompleteCheckoutWithOrderCommand extends ICommand {
  checkoutId: string;
  paymentIntentId: string;
  userId?: string;
  guestToken?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
}

export class CompleteCheckoutWithOrderHandler implements ICommandHandler<CompleteCheckoutWithOrderCommand, CommandResult<OrderResult>> {
  constructor(private readonly checkoutOrderService: CheckoutOrderService) {}

  async handle(command: CompleteCheckoutWithOrderCommand): Promise<CommandResult<OrderResult>> {
    const result = await this.checkoutOrderService.completeCheckoutWithOrder({
      checkoutId: command.checkoutId,
      paymentIntentId: command.paymentIntentId,
      userId: command.userId,
      guestToken: command.guestToken,
      shippingAddress: command.shippingAddress,
      billingAddress: command.billingAddress,
    });
    return CommandResult.success<OrderResult>(result);
  }
}
