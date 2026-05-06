import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDTO } from "../services/checkout.service";

export interface CompleteCheckoutCommand extends ICommand {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class CompleteCheckoutHandler implements ICommandHandler<
  CompleteCheckoutCommand,
  CommandResult<CheckoutDTO>
> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(
    command: CompleteCheckoutCommand,
  ): Promise<CommandResult<CheckoutDTO>> {
    const checkout = await this.checkoutService.completeCheckout({
      checkoutId: command.checkoutId,
      userId: command.userId,
      guestToken: command.guestToken,
    });
    return CommandResult.success<CheckoutDTO>(checkout);
  }
}
