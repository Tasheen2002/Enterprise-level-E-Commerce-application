import { PaymentMethodService } from "../services/payment-method.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface DeletePaymentMethodCommand extends ICommand {
  paymentMethodId: string;
  userId: string;
}

export interface DeletePaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  deleted: boolean;
  message: string;
}

export class DeletePaymentMethodHandler implements ICommandHandler<
  DeletePaymentMethodCommand,
  CommandResult<DeletePaymentMethodResult>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: DeletePaymentMethodCommand,
  ): Promise<CommandResult<DeletePaymentMethodResult>> {
    try {
      // Validate command
      if (!command.paymentMethodId || !command.userId) {
        return CommandResult.failure<DeletePaymentMethodResult>(
          "Payment Method ID and User ID are required",
          ["paymentMethodId", "userId"],
        );
      }

      // Delete payment method through service
      await this.paymentMethodService.deletePaymentMethod(
        command.paymentMethodId,
        command.userId,
      );

      const result: DeletePaymentMethodResult = {
        paymentMethodId: command.paymentMethodId,
        userId: command.userId,
        deleted: true,
        message: "Payment method deleted successfully",
      };

      return CommandResult.success<DeletePaymentMethodResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<DeletePaymentMethodResult>(
          "Failed to delete payment method",
          [error.message],
        );
      }

      return CommandResult.failure<DeletePaymentMethodResult>(
        "An unexpected error occurred while deleting payment method",
      );
    }
  }
}
