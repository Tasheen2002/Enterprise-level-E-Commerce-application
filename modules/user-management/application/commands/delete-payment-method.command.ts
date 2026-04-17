import { PaymentMethodService } from '../services/payment-method.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface DeletePaymentMethodCommand extends ICommand {
  readonly paymentMethodId: string;
  readonly userId: string;
}

export class DeletePaymentMethodHandler implements ICommandHandler<
  DeletePaymentMethodCommand,
  CommandResult<void>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: DeletePaymentMethodCommand
  ): Promise<CommandResult<void>> {
    await this.paymentMethodService.deletePaymentMethod(command.paymentMethodId, command.userId);
    return CommandResult.success(undefined);
  }
}
