import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransaction, LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { LoyaltyTransactionReason } from '../../domain/enums/loyalty.enums';

export interface EarnPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly reason: LoyaltyTransactionReason;
  readonly description?: string;
  readonly referenceId?: string;
  readonly orderId?: string;
}

export class EarnPointsHandler implements ICommandHandler<
  EarnPointsCommand,
  CommandResult<LoyaltyTransactionDTO>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: EarnPointsCommand): Promise<CommandResult<LoyaltyTransactionDTO>> {
    const transaction = await this.loyaltyService.earnPoints({
      userId: command.userId,
      points: command.points,
      reason: command.reason,
      description: command.description,
      referenceId: command.referenceId,
      orderId: command.orderId,
    });
    return CommandResult.success(LoyaltyTransaction.toDTO(transaction));
  }
}
