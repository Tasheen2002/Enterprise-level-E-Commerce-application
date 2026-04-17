import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService, PaymentIntentDto } from '../services/payment.service';

export interface CreatePaymentIntentCommand extends ICommand {
  readonly orderId: string;
  readonly provider: string;
  readonly amount: number;
  readonly currency?: string;
  readonly idempotencyKey?: string;
  readonly clientSecret?: string;
  readonly userId?: string;
}

export class CreatePaymentIntentHandler implements ICommandHandler<
  CreatePaymentIntentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(command: CreatePaymentIntentCommand): Promise<CommandResult<PaymentIntentDto>> {
    const paymentIntent = await this.paymentService.createPaymentIntent({
      orderId: command.orderId,
      provider: command.provider,
      amount: command.amount,
      currency: command.currency,
      idempotencyKey: command.idempotencyKey,
      clientSecret: command.clientSecret,
      userId: command.userId,
    });
    return CommandResult.success(paymentIntent);
  }
}
