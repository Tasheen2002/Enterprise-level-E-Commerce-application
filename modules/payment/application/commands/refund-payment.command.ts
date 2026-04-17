import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService, PaymentIntentDto } from '../services/payment.service';

export interface RefundPaymentCommand extends ICommand {
  readonly intentId: string;
  readonly amount?: number;
  readonly reason?: string;
  readonly userId?: string;
}

export class RefundPaymentHandler implements ICommandHandler<
  RefundPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(command: RefundPaymentCommand): Promise<CommandResult<PaymentIntentDto>> {
    const paymentIntent = await this.paymentService.refundPayment({
      intentId: command.intentId,
      amount: command.amount,
      reason: command.reason,
      userId: command.userId,
    });
    return CommandResult.success(paymentIntent);
  }
}
