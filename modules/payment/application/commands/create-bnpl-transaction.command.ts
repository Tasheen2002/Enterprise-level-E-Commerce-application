import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { BnplTransactionService, BnplTransactionDto } from '../services/bnpl-transaction.service';
import { BnplPlan } from '../../domain/entities/bnpl-transaction.entity';

export interface CreateBnplTransactionCommand extends ICommand {
  readonly intentId: string;
  readonly provider: string;
  readonly plan: BnplPlan;
  readonly userId?: string;
}

export class CreateBnplTransactionHandler implements ICommandHandler<
  CreateBnplTransactionCommand,
  CommandResult<BnplTransactionDto>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(command: CreateBnplTransactionCommand): Promise<CommandResult<BnplTransactionDto>> {
    const txn = await this.bnplService.createBnplTransaction({
      intentId: command.intentId,
      provider: command.provider,
      plan: command.plan,
      userId: command.userId,
    });
    return CommandResult.success(txn);
  }
}
