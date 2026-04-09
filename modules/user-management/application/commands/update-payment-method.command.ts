import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface UpdatePaymentMethodInput extends ICommand {
  paymentMethodId: string;
  userId: string;
  billingAddressId?: string;
  isDefault?: boolean;
  expMonth?: number;
  expYear?: number;
  providerRef?: string;
}

export class UpdatePaymentMethodHandler implements ICommandHandler<
  UpdatePaymentMethodInput,
  CommandResult<PaymentMethodDTO>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    input: UpdatePaymentMethodInput
  ): Promise<CommandResult<PaymentMethodDTO>> {
    const result = await this.paymentMethodService.updatePaymentMethod({
      paymentMethodId: input.paymentMethodId,
      userId: input.userId,
      billingAddressId: input.billingAddressId,
      isDefault: input.isDefault,
      expMonth: input.expMonth,
      expYear: input.expYear,
      providerRef: input.providerRef,
    });

    return CommandResult.success(result);
  }
}
