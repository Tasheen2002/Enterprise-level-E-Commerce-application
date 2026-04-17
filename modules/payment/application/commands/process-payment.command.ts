import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService, PaymentIntentDto } from '../services/payment.service';

export interface ProcessPaymentCommand extends ICommand {
  readonly intentId: string;
  readonly pspReference?: string;
  readonly userId?: string;
}

export class ProcessPaymentHandler implements ICommandHandler<
  ProcessPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(command: ProcessPaymentCommand): Promise<CommandResult<PaymentIntentDto>> {
    const authorized = await this.paymentService.authorizePayment({
      intentId: command.intentId,
      pspReference: command.pspReference,
      userId: command.userId,
    });
    const captured = await this.paymentService.capturePayment(
      authorized.intentId,
      command.pspReference,
      command.userId,
    );
    return CommandResult.success(captured);
  }
}
