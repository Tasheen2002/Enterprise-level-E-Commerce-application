import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PaymentMethodService } from "../services/payment-method.service";
import { DeletePaymentMethodCommand, DeletePaymentMethodResult } from "./delete-payment-method.command";

export class DeletePaymentMethodHandler implements ICommandHandler<DeletePaymentMethodCommand, CommandResult<DeletePaymentMethodResult>> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(command: DeletePaymentMethodCommand): Promise<CommandResult<DeletePaymentMethodResult>> {
    try {
      await this.paymentMethodService.deletePaymentMethod(command.paymentMethodId, command.userId);
      return CommandResult.success<DeletePaymentMethodResult>({
        paymentMethodId: command.paymentMethodId,
        userId: command.userId,
        deleted: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      return CommandResult.failure<DeletePaymentMethodResult>(
        error instanceof Error ? error.message : "Failed to delete payment method",
      );
    }
  }
}
