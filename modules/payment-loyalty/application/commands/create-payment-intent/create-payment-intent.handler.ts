import {
  PaymentService,
  CreatePaymentIntentDto,
  PaymentIntentDto,
} from "../../services/payment.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreatePaymentIntentCommand } from "./create-payment-intent.command";

export class CreatePaymentIntentHandler implements ICommandHandler<
  CreatePaymentIntentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    command: CreatePaymentIntentCommand,
  ): Promise<CommandResult<PaymentIntentDto>> {
    try {
      const dto: CreatePaymentIntentDto = {
        orderId: command.orderId,
        provider: command.provider,
        amount: command.amount,
        currency: command.currency,
        idempotencyKey: command.idempotencyKey,
        clientSecret: command.clientSecret,
        userId: command.userId,
      };

      const paymentIntent = await this.paymentService.createPaymentIntent(dto);

      return CommandResult.success<PaymentIntentDto>(paymentIntent);
    } catch (error) {
      return CommandResult.failure<PaymentIntentDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating payment intent",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
