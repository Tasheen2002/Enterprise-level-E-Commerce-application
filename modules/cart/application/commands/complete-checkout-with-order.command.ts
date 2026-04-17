import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  CheckoutOrderService,
  OrderResult,
} from "../services/checkout-order.service";

export interface CompleteCheckoutWithOrderCommand extends ICommand {
  readonly checkoutId: string;
  readonly paymentIntentId: string;
  readonly userId?: string;
  readonly guestToken?: string;
  readonly shippingAddress: {
    readonly firstName: string;
    readonly lastName: string;
    readonly addressLine1: string;
    readonly addressLine2?: string;
    readonly city: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country: string;
    readonly phone?: string;
  };
  readonly billingAddress?: {
    readonly firstName: string;
    readonly lastName: string;
    readonly addressLine1: string;
    readonly addressLine2?: string;
    readonly city: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country: string;
    readonly phone?: string;
  };
}

export class CompleteCheckoutWithOrderHandler implements ICommandHandler<
  CompleteCheckoutWithOrderCommand,
  CommandResult<OrderResult>
> {
  constructor(private readonly checkoutOrderService: CheckoutOrderService) {}

  async handle(
    command: CompleteCheckoutWithOrderCommand,
  ): Promise<CommandResult<OrderResult>> {
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
