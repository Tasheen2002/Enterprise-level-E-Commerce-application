import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import {
  PaymentService,
  CreatePaymentIntentDto,
  PaymentIntentDto,
} from "../services/payment.service";

export interface CreatePaymentIntentCommand extends ICommand {
  orderId: string;
  provider: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  clientSecret?: string;
  userId?: string;
}

export class CreatePaymentIntentHandler implements ICommandHandler<
  CreatePaymentIntentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    command: CreatePaymentIntentCommand,
  ): Promise<CommandResult<PaymentIntentDto>> {
    try {
      // Validate command
      if (!command.orderId) {
        return CommandResult.failure<PaymentIntentDto>("Order ID is required", [
          "orderId",
        ]);
      }

      if (!command.provider) {
        return CommandResult.failure<PaymentIntentDto>("Provider is required", [
          "provider",
        ]);
      }

      if (!command.amount || command.amount <= 0) {
        return CommandResult.failure<PaymentIntentDto>(
          "Amount must be greater than 0",
          ["amount"],
        );
      }

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
        error instanceof Error ? error.message : "An unexpected error occurred while creating payment intent",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
