import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import {
  SetDefaultPaymentMethodCommand,
  SetDefaultPaymentMethodResult,
} from "./set-default-payment-method.command";
import { PaymentMethodService } from "../../services/payment-method.service";

export class SetDefaultPaymentMethodHandler implements ICommandHandler<
  SetDefaultPaymentMethodCommand,
  CommandResult<SetDefaultPaymentMethodResult>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    command: SetDefaultPaymentMethodCommand,
  ): Promise<CommandResult<SetDefaultPaymentMethodResult>> {
    try {
      await this.paymentMethodService.setDefaultPaymentMethod(
        command.paymentMethodId,
        command.userId,
      );

      return CommandResult.success<SetDefaultPaymentMethodResult>({
        paymentMethodId: command.paymentMethodId,
        userId: command.userId,
        message: "Default payment method updated",
      });
    } catch (error) {
      return CommandResult.failure<SetDefaultPaymentMethodResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
