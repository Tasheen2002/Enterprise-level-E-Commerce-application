import { PaymentMethodService } from '../services/payment-method.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface SetDefaultPaymentMethodInput extends ICommand {
  paymentMethodId: string;
  userId: string;
}

export class SetDefaultPaymentMethodHandler implements ICommandHandler<
  SetDefaultPaymentMethodInput,
  CommandResult<void>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    input: SetDefaultPaymentMethodInput
  ): Promise<CommandResult<void>> {
    await this.paymentMethodService.setDefaultPaymentMethod(input.paymentMethodId, input.userId);
    return CommandResult.success(undefined);
  }
}
