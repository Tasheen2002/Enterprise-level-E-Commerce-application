import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import { PaymentMethodType } from '../../domain/enums/payment-method-type.enum';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface AddPaymentMethodInput extends ICommand {
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
  AddPaymentMethodInput,
  CommandResult<PaymentMethodDTO>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    input: AddPaymentMethodInput
  ): Promise<CommandResult<PaymentMethodDTO>> {
    const type = PaymentMethodType.fromString(input.type);

    const result = await this.paymentMethodService.addPaymentMethod({
      userId: input.userId,
      type,
      brand: input.brand,
      last4: input.last4,
      expMonth: input.expMonth,
      expYear: input.expYear,
      billingAddressId: input.billingAddressId,
      providerRef: input.providerRef,
      isDefault: input.isDefault,
    });

    return CommandResult.success(result);
  }
}
