import {
  BnplTransactionService,
  CreateBnplTransactionDto,
  BnplTransactionDto,
} from "../../services/bnpl-transaction.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateBnplTransactionCommand } from "./create-bnpl-transaction.command";

export class CreateBnplTransactionHandler implements ICommandHandler<
  CreateBnplTransactionCommand,
  CommandResult<BnplTransactionDto>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(
    command: CreateBnplTransactionCommand,
  ): Promise<CommandResult<BnplTransactionDto>> {
    try {
      const dto: CreateBnplTransactionDto = {
        intentId: command.intentId,
        provider: command.provider,
        plan: command.plan,
        userId: command.userId,
      };

      const txn = await this.bnplService.createBnplTransaction(dto);

      return CommandResult.success<BnplTransactionDto>(txn);
    } catch (error) {
      return CommandResult.failure<BnplTransactionDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating BNPL transaction",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
