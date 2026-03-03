import {
  PaymentService,
  RefundPaymentDto,
  PaymentIntentDto,
} from "../services/payment.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { RefundPaymentCommand } from "./refund-payment.command";

export class RefundPaymentHandler implements ICommandHandler<
  RefundPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    command: RefundPaymentCommand,
  ): Promise<CommandResult<PaymentIntentDto>> {
    try {
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
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while refunding payment",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
