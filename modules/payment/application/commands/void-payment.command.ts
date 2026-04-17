import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService } from '../services/payment.service';
import { PaymentIntentDTO } from '../../domain/entities/payment-intent.entity';

export interface VoidPaymentCommand extends ICommand {
  readonly intentId: string;
  readonly pspReference?: string;
  readonly userId?: string;
}

export class VoidPaymentHandler implements ICommandHandler<
  VoidPaymentCommand,
  CommandResult<PaymentIntentDTO>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(command: VoidPaymentCommand): Promise<CommandResult<PaymentIntentDTO>> {
    const result = await this.paymentService.voidPayment({
      intentId: command.intentId,
      pspReference: command.pspReference,
      userId: command.userId,
    });
    return CommandResult.success(result);
  }
}
