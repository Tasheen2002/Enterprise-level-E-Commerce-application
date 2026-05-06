import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { LoyaltyTransactionReasonValue } from '../../domain/value-objects/loyalty-reason.vo';

export interface AwardLoyaltyPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly reason: LoyaltyTransactionReasonValue;
  readonly orderId?: string;
  readonly description?: string;
}

export class AwardLoyaltyPointsHandler implements ICommandHandler<
  AwardLoyaltyPointsCommand,
  CommandResult<LoyaltyTransactionDTO>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: AwardLoyaltyPointsCommand): Promise<CommandResult<LoyaltyTransactionDTO>> {
    const transaction = await this.loyaltyService.earnPoints({
      userId: command.userId,
      points: command.points,
      reason: command.reason,
      orderId: command.orderId,
      description: command.description,
    });
    return CommandResult.success(transaction);
  }
}
