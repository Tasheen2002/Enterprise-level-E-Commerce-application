import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDto } from "../services/checkout.service";

export interface CompleteCheckoutCommand extends ICommand {
  checkoutId: string;
  userId?: string;
  guestToken?: string;
}

export class CompleteCheckoutHandler implements ICommandHandler<CompleteCheckoutCommand, CommandResult<CheckoutDto>> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(command: CompleteCheckoutCommand): Promise<CommandResult<CheckoutDto>> {
    const checkout = await this.checkoutService.completeCheckout({
      checkoutId: command.checkoutId,
      userId: command.userId,
      guestToken: command.guestToken,
    });
    return CommandResult.success<CheckoutDto>(checkout);
  }
}
