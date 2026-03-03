import {
  PaymentService,
  VoidPaymentDto,
  PaymentIntentDto,
} from "../services/payment.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { VoidPaymentCommand } from "./void-payment.command";

export class VoidPaymentHandler implements ICommandHandler<
  VoidPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    command: VoidPaymentCommand,
  ): Promise<CommandResult<PaymentIntentDto>> {
    try {
      const dto: VoidPaymentDto = {
        intentId: command.intentId,
        pspReference: command.pspReference,
        userId: command.userId,
      };

      const result = await this.paymentService.voidPayment(dto);
      return CommandResult.success<PaymentIntentDto>(result);
    } catch (error) {
      return CommandResult.failure<PaymentIntentDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while voiding payment",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
