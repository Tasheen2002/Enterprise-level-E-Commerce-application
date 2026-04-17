import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { BnplTransactionService } from '../services/bnpl-transaction.service';
import { BnplTransactionDTO, BnplPlan } from '../../domain/entities/bnpl-transaction.entity';

export interface CreateBnplTransactionCommand extends ICommand {
  readonly intentId: string;
  readonly provider: string;
  readonly plan: BnplPlan;
  readonly userId?: string;
}

export class CreateBnplTransactionHandler implements ICommandHandler<
  CreateBnplTransactionCommand,
  CommandResult<BnplTransactionDTO>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(command: CreateBnplTransactionCommand): Promise<CommandResult<BnplTransactionDTO>> {
    const txn = await this.bnplService.createBnplTransaction({
      intentId: command.intentId,
      provider: command.provider,
      plan: command.plan,
      userId: command.userId,
    });
    return CommandResult.success(txn);
  }
}
