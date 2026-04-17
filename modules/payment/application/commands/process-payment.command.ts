import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService } from '../services/payment.service';
import { PaymentIntentDTO } from '../../domain/entities/payment-intent.entity';

export interface ProcessPaymentCommand extends ICommand {
  readonly intentId: string;
  readonly pspReference?: string;
  readonly userId?: string;
}

export class ProcessPaymentHandler implements ICommandHandler<
  ProcessPaymentCommand,
  CommandResult<PaymentIntentDTO>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(command: ProcessPaymentCommand): Promise<CommandResult<PaymentIntentDTO>> {
    const authorized = await this.paymentService.authorizePayment({
      intentId: command.intentId,
      pspReference: command.pspReference,
      userId: command.userId,
    });
    const captured = await this.paymentService.capturePayment(
      authorized.id,
      command.pspReference,
      command.userId,
    );
    return CommandResult.success(captured);
  }
}
