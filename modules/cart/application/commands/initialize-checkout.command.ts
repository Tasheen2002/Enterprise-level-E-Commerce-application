import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDTO } from "../services/checkout.service";

export interface InitializeCheckoutCommand extends ICommand {
  readonly cartId: string;
  readonly userId?: string;
  readonly guestToken?: string;
  readonly expiresInMinutes?: number;
}

export class InitializeCheckoutHandler implements ICommandHandler<
  InitializeCheckoutCommand,
  CommandResult<CheckoutDTO>
> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(
    command: InitializeCheckoutCommand,
  ): Promise<CommandResult<CheckoutDTO>> {
    const checkout = await this.checkoutService.initializeCheckout({
      cartId: command.cartId,
      userId: command.userId,
      guestToken: command.guestToken,
      expiresInMinutes: command.expiresInMinutes,
    });
    return CommandResult.success<CheckoutDTO>(checkout);
  }
}
