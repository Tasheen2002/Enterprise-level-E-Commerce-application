import {
  PaymentService,
  ProcessPaymentDto,
  PaymentIntentDto,
} from "../services/payment.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface ProcessPaymentCommand extends ICommand {
  intentId: string;
  pspReference?: string;
  userId?: string;
}

export class ProcessPaymentHandler implements ICommandHandler<
  ProcessPaymentCommand,
  CommandResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    command: ProcessPaymentCommand,
  ): Promise<CommandResult<PaymentIntentDto>> {
    try {
      // Validate command
      if (!command.intentId) {
        return CommandResult.failure<PaymentIntentDto>(
          "Intent ID is required",
          ["intentId"],
        );
      }

      const dto: ProcessPaymentDto = {
        intentId: command.intentId,
        pspReference: command.pspReference,
        userId: command.userId,
      };

      // Authorize and capture the payment
      const authorized = await this.paymentService.authorizePayment(dto);
      const captured = await this.paymentService.capturePayment(
        authorized.intentId,
        dto.pspReference,
        command.userId,
      );

      return CommandResult.success<PaymentIntentDto>(captured);
    } catch (error) {
      return CommandResult.failure<PaymentIntentDto>(
        error instanceof Error ? error.message : "An unexpected error occurred while processing payment",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
