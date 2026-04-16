import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDto } from "../services/checkout.service";

export interface CancelCheckoutCommand extends ICommand {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class CancelCheckoutHandler implements ICommandHandler<
  CancelCheckoutCommand,
  CommandResult<CheckoutDto>
> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(
    command: CancelCheckoutCommand,
  ): Promise<CommandResult<CheckoutDto>> {
    const checkout = await this.checkoutService.cancelCheckout(
      command.checkoutId,
      command.userId,
      command.guestToken,
    );
    return CommandResult.success<CheckoutDto>(checkout);
  }
}
