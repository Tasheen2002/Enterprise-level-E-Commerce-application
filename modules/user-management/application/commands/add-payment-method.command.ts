import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import { PaymentMethodType } from '../../domain/enums/payment-method-type.enum';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface AddPaymentMethodCommand extends ICommand {
  userId: string;
  type: 'card' | 'wallet' | 'bank' | 'cod' | 'gift_card';
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

export class AddPaymentMethodHandler implements ICommandHandler<
  AddPaymentMethodCommand,
  CommandResult<PaymentMethodDTO>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: AddPaymentMethodCommand
  ): Promise<CommandResult<PaymentMethodDTO>> {
    const type = PaymentMethodType.fromString(command.type);

    const result = await this.paymentMethodService.addPaymentMethod({
      userId: command.userId,
      type,
      brand: command.brand,
      last4: command.last4,
      expMonth: command.expMonth,
      expYear: command.expYear,
      billingAddressId: command.billingAddressId,
      providerRef: command.providerRef,
      isDefault: command.isDefault,
    });

    return CommandResult.success(result);
  }
}
