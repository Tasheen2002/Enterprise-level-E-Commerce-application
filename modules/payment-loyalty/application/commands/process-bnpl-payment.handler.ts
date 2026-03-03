import {
  BnplTransactionService,
  BnplTransactionDto,
} from "../services/bnpl-transaction.service";
import {
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { ProcessBnplPaymentCommand } from "./process-bnpl-payment.command";

export class ProcessBnplPaymentHandler implements ICommandHandler<
  ProcessBnplPaymentCommand,
  CommandResult<BnplTransactionDto>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(
    command: ProcessBnplPaymentCommand,
  ): Promise<CommandResult<BnplTransactionDto>> {
    try {
      let result: BnplTransactionDto;
      switch (command.action) {
        case "approve":
          result = await this.bnplService.approveBnplTransaction(
            command.bnplId,
            command.userId,
          );
          break;
        case "reject":
          result = await this.bnplService.rejectBnplTransaction(
            command.bnplId,
            command.userId,
          );
          break;
        case "activate":
          result = await this.bnplService.activateBnplTransaction(
            command.bnplId,
            command.userId,
          );
          break;
        case "complete":
          result = await this.bnplService.completeBnplTransaction(
            command.bnplId,
            command.userId,
          );
          break;
        case "cancel":
          result = await this.bnplService.cancelBnplTransaction(
            command.bnplId,
            command.userId,
          );
          break;
        default:
          return CommandResult.failure<BnplTransactionDto>(
            "Unsupported action",
            ["action"],
          );
      }

      return CommandResult.success<BnplTransactionDto>(result);
    } catch (error) {
      return CommandResult.failure<BnplTransactionDto>(
        error instanceof Error ? error.message : "An unexpected error occurred while processing BNPL payment",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
