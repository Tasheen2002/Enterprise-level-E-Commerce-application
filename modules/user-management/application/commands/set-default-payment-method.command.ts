import { PaymentMethodService } from '../services/payment-method.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface SetDefaultPaymentMethodCommand extends ICommand {
  readonly paymentMethodId: string;
  readonly userId: string;
}

export class SetDefaultPaymentMethodHandler implements ICommandHandler<
  SetDefaultPaymentMethodCommand,
  CommandResult<void>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: SetDefaultPaymentMethodCommand
  ): Promise<CommandResult<void>> {
    await this.paymentMethodService.setDefaultPaymentMethod(command.paymentMethodId, command.userId);
    return CommandResult.success(undefined);
  }
}
