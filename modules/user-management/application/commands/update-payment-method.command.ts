import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface UpdatePaymentMethodCommand extends ICommand {
  paymentMethodId: string;
  userId: string;
  billingAddressId?: string;
  isDefault?: boolean;
  expMonth?: number;
  expYear?: number;
  providerRef?: string;
}

export class UpdatePaymentMethodHandler implements ICommandHandler<
  UpdatePaymentMethodCommand,
  CommandResult<PaymentMethodDTO>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: UpdatePaymentMethodCommand
  ): Promise<CommandResult<PaymentMethodDTO>> {
    const result = await this.paymentMethodService.updatePaymentMethod({
      paymentMethodId: command.paymentMethodId,
      userId: command.userId,
      billingAddressId: command.billingAddressId,
      isDefault: command.isDefault,
      expMonth: command.expMonth,
      expYear: command.expYear,
      providerRef: command.providerRef,
    });

    return CommandResult.success(result);
  }
}
