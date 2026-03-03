import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PaymentMethodService } from "../services/payment-method.service";
import { UpdatePaymentMethodCommand, UpdatePaymentMethodResult } from "./update-payment-method.command";

export class UpdatePaymentMethodHandler implements ICommandHandler<UpdatePaymentMethodCommand, CommandResult<UpdatePaymentMethodResult>> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(command: UpdatePaymentMethodCommand): Promise<CommandResult<UpdatePaymentMethodResult>> {
    try {
      await this.paymentMethodService.updatePaymentMethod({
        paymentMethodId: command.paymentMethodId,
        userId: command.userId,
        billingAddressId: command.billingAddressId,
        isDefault: command.isDefault,
        expMonth: command.expMonth,
        expYear: command.expYear,
        providerRef: command.providerRef,
      });

      return CommandResult.success<UpdatePaymentMethodResult>({
        paymentMethodId: command.paymentMethodId,
        userId: command.userId,
        updated: true,
        message: "Payment method updated successfully",
      });
    } catch (error) {
      return CommandResult.failure<UpdatePaymentMethodResult>(
        error instanceof Error ? error.message : "Failed to update payment method",
      );
    }
  }
}
