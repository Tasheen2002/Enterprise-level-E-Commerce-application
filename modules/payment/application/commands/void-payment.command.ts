import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService, PaymentIntentDto } from '../services/payment.service';

export interface VoidPaymentCommand extends ICommand {
  readonly intentId: string;
  readonly pspReference?: string;
  readonly userId?: string;
}

export class VoidPaymentHandler implements ICommandHandler<
  VoidPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(command: VoidPaymentCommand): Promise<CommandResult<PaymentIntentDto>> {
    const result = await this.paymentService.voidPayment({
      intentId: command.intentId,
      pspReference: command.pspReference,
      userId: command.userId,
    });
    return CommandResult.success(result);
  }
}
