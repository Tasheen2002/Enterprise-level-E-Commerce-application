import { PaymentMethodService } from "../services/payment-method.service";
import { PaymentMethodType } from "../../domain/entities/payment-method.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface AddPaymentMethodCommand extends ICommand {
  userId: string;
  type: "card" | "wallet" | "bank" | "cod" | "gift_card";
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

export interface AddPaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  type: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  billingAddressId?: string | null;
  isDefault: boolean;
  createdAt: Date;
}

export class AddPaymentMethodHandler implements ICommandHandler<
  AddPaymentMethodCommand,
  CommandResult<AddPaymentMethodResult>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: AddPaymentMethodCommand,
  ): Promise<CommandResult<AddPaymentMethodResult>> {
    try {
      // Validate command
      if (!command.userId || !command.type) {
        return CommandResult.failure<AddPaymentMethodResult>(
          "User ID and payment method type are required",
          ["userId", "type"],
        );
      }

      // For card payments, require additional fields
      if (
        command.type === "card" &&
        (!command.last4 || !command.expMonth || !command.expYear)
      ) {
        return CommandResult.failure<AddPaymentMethodResult>(
          "Card payments require last4, expMonth, and expYear",
          ["last4", "expMonth", "expYear"],
        );
      }

      // Convert string type to PaymentMethodType enum
      const paymentMethodType = PaymentMethodType.fromString(command.type);

      // Add payment method through service
      const paymentMethod = await this.paymentMethodService.addPaymentMethod({
        userId: command.userId,
        type: paymentMethodType,
        brand: command.brand,
        last4: command.last4,
        expMonth: command.expMonth,
        expYear: command.expYear,
        billingAddressId: command.billingAddressId,
        providerRef: command.providerRef,
        isDefault: command.isDefault || false,
      });

      const result: AddPaymentMethodResult = {
        paymentMethodId: paymentMethod.id,
        userId: paymentMethod.userId,
        type: paymentMethod.type,
        brand: paymentMethod.brand,
        last4: paymentMethod.last4,
        expMonth: paymentMethod.expMonth,
        expYear: paymentMethod.expYear,
        billingAddressId: paymentMethod.billingAddressId,
        isDefault: paymentMethod.isDefault,
        createdAt: paymentMethod.createdAt,
      };

      return CommandResult.success<AddPaymentMethodResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<AddPaymentMethodResult>(
          "Failed to add payment method",
          [error.message],
        );
      }

      return CommandResult.failure<AddPaymentMethodResult>(
        "An unexpected error occurred while adding payment method",
      );
    }
  }
}
