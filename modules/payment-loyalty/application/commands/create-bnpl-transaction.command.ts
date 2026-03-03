import {
  BnplTransactionService,
  CreateBnplTransactionDto,
  BnplTransactionDto,
} from "../services/bnpl-transaction.service";
import { BnplPlan } from "../../domain/entities/bnpl-transaction.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface CreateBnplTransactionCommand extends ICommand {
  intentId: string;
  provider: string;
  plan: BnplPlan;
  userId?: string;
}

export class CreateBnplTransactionHandler implements ICommandHandler<
  CreateBnplTransactionCommand,
  CommandResult<BnplTransactionDto>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(
    command: CreateBnplTransactionCommand,
  ): Promise<CommandResult<BnplTransactionDto>> {
    try {
      // Validate command
      const errors: string[] = [];

      if (!command.intentId) {
        errors.push("intentId");
      }
      if (!command.provider) {
        errors.push("provider");
      }
      if (!command.plan) {
        errors.push("plan");
      }

      if (errors.length > 0) {
        return CommandResult.failure<BnplTransactionDto>(
          "Validation failed",
          errors,
        );
      }

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
        error instanceof Error ? error.message : "An unexpected error occurred while creating BNPL transaction",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
