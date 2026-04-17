import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransaction, LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { LoyaltyTransactionReason } from '../../domain/enums/loyalty.enums';

export interface RedeemPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly reason: LoyaltyTransactionReason;
  readonly description?: string;
  readonly referenceId?: string;
}

export class RedeemPointsHandler implements ICommandHandler<
  RedeemPointsCommand,
  CommandResult<LoyaltyTransactionDTO>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: RedeemPointsCommand): Promise<CommandResult<LoyaltyTransactionDTO>> {
    const transaction = await this.loyaltyService.redeemPoints({
      userId: command.userId,
      points: command.points,
      reason: command.reason,
      description: command.description,
      referenceId: command.referenceId,
    });
    return CommandResult.success(LoyaltyTransaction.toDTO(transaction));
  }
}
