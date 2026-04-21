import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';

export interface AdjustLoyaltyPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly isAddition: boolean;
  readonly reason: string;
  readonly createdBy: string;
}

export class AdjustLoyaltyPointsHandler implements ICommandHandler<
  AdjustLoyaltyPointsCommand,
  CommandResult<LoyaltyTransactionDTO>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: AdjustLoyaltyPointsCommand): Promise<CommandResult<LoyaltyTransactionDTO>> {
    const transaction = await this.loyaltyService.adjustPoints({
      userId: command.userId,
      points: command.points,
      isAddition: command.isAddition,
      reason: command.reason,
      createdBy: command.createdBy,
    });
    return CommandResult.success(transaction);
  }
}
