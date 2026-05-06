import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDTO } from "../services/checkout.service";

export interface CancelCheckoutCommand extends ICommand {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class CancelCheckoutHandler implements ICommandHandler<
  CancelCheckoutCommand,
  CommandResult<CheckoutDTO>
> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(
    command: CancelCheckoutCommand,
  ): Promise<CommandResult<CheckoutDTO>> {
    const checkout = await this.checkoutService.cancelCheckout(
      command.checkoutId,
      command.userId,
      command.guestToken,
    );
    return CommandResult.success<CheckoutDTO>(checkout);
  }
}
