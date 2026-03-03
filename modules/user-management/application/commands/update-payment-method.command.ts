import { PaymentMethodService } from "../services/payment-method.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface UpdatePaymentMethodCommand extends ICommand {
  paymentMethodId: string;
  userId: string;
  billingAddressId?: string;
  isDefault?: boolean;
  expMonth?: number;
  expYear?: number;
  providerRef?: string;
}

export interface UpdatePaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  updated: boolean;
  message: string;
}

export class UpdatePaymentMethodHandler implements ICommandHandler<
  UpdatePaymentMethodCommand,
  CommandResult<UpdatePaymentMethodResult>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: UpdatePaymentMethodCommand,
  ): Promise<CommandResult<UpdatePaymentMethodResult>> {
    try {
      // Validate command
      if (!command.paymentMethodId || !command.userId) {
        return CommandResult.failure<UpdatePaymentMethodResult>(
          "Payment Method ID and User ID are required",
          ["paymentMethodId", "userId"],
        );
      }

      // Update payment method through service
      const updatedPaymentMethod =
        await this.paymentMethodService.updatePaymentMethod({
          paymentMethodId: command.paymentMethodId,
          userId: command.userId,
          billingAddressId: command.billingAddressId,
          isDefault: command.isDefault,
          expMonth: command.expMonth,
          expYear: command.expYear,
          providerRef: command.providerRef,
        });

      const result: UpdatePaymentMethodResult = {
        paymentMethodId: command.paymentMethodId,
        userId: command.userId,
        updated: true,
        message: "Payment method updated successfully",
      };

      return CommandResult.success<UpdatePaymentMethodResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<UpdatePaymentMethodResult>(
          "Failed to update payment method",
          [error.message],
        );
      }

      return CommandResult.failure<UpdatePaymentMethodResult>(
        "An unexpected error occurred while updating payment method",
      );
    }
  }
}
