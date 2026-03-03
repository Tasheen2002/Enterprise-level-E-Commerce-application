import {
  PaymentService,
  RefundPaymentDto,
  PaymentIntentDto,
} from "../services/payment.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface RefundPaymentCommand extends ICommand {
  intentId: string;
  amount?: number;
  reason?: string;
  userId?: string;
}

export class RefundPaymentHandler implements ICommandHandler<
  RefundPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    command: RefundPaymentCommand,
  ): Promise<CommandResult<PaymentIntentDto>> {
    try {
      // Validate command
      if (!command.intentId) {
        return CommandResult.failure<PaymentIntentDto>(
          "Intent ID is required",
          ["intentId"],
        );
      }

      if (command.amount !== undefined && command.amount <= 0) {
        return CommandResult.failure<PaymentIntentDto>(
          "Refund amount must be greater than 0",
          ["amount"],
        );
      }

      const dto: RefundPaymentDto = {
        intentId: command.intentId,
        amount: command.amount,
        reason: command.reason,
        userId: command.userId,
      };

      const paymentIntent = await this.paymentService.refundPayment(dto);

      return CommandResult.success<PaymentIntentDto>(paymentIntent);
    } catch (error) {
      return CommandResult.failure<PaymentIntentDto>(
        error instanceof Error ? error.message : "An unexpected error occurred while refunding payment",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
