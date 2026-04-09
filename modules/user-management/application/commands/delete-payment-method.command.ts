import { PaymentMethodService } from '../services/payment-method.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface DeletePaymentMethodInput extends ICommand {
  paymentMethodId: string;
  userId: string;
}

export class DeletePaymentMethodHandler implements ICommandHandler<
  DeletePaymentMethodInput,
  CommandResult<void>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    input: DeletePaymentMethodInput
  ): Promise<CommandResult<void>> {
    await this.paymentMethodService.deletePaymentMethod(input.paymentMethodId, input.userId);
    return CommandResult.success(undefined);
  }
}
