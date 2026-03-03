import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PaymentMethodService } from "../services/payment-method.service";
import { PaymentMethodType } from "../../domain/entities/payment-method.entity";
import { AddPaymentMethodCommand, AddPaymentMethodResult } from "./add-payment-method.command";

export class AddPaymentMethodHandler implements ICommandHandler<AddPaymentMethodCommand, CommandResult<AddPaymentMethodResult>> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(command: AddPaymentMethodCommand): Promise<CommandResult<AddPaymentMethodResult>> {
    try {
      const paymentMethod = await this.paymentMethodService.addPaymentMethod({
        userId: command.userId,
        type: PaymentMethodType.fromString(command.type),
        brand: command.brand,
        last4: command.last4,
        expMonth: command.expMonth,
        expYear: command.expYear,
        billingAddressId: command.billingAddressId,
        providerRef: command.providerRef,
        isDefault: command.isDefault || false,
      });

      return CommandResult.success<AddPaymentMethodResult>({
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
      });
    } catch (error) {
      return CommandResult.failure<AddPaymentMethodResult>(
        error instanceof Error ? error.message : "Failed to add payment method",
      );
    }
  }
}
