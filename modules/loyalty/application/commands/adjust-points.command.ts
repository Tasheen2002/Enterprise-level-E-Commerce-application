import { LoyaltyService, AdjustPointsData, LoyaltyTransactionData } from '../services/loyalty.service';
import { ICommand, ICommandHandler, CommandResult } from './earn-points.command';

export interface AdjustPointsCommand extends ICommand {
  userId: string;
  points: number;
  isAddition: boolean;
  reason: string;
  createdBy: string;
}

export class AdjustPointsHandler implements ICommandHandler<AdjustPointsCommand, CommandResult<LoyaltyTransactionData>> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: AdjustPointsCommand): Promise<CommandResult<LoyaltyTransactionData>> {
    try {
      if (!command.userId || !command.reason || !command.createdBy) {
        return CommandResult.failure<LoyaltyTransactionData>(
          'User ID, reason, and creator are required',
          ['userId', 'reason', 'createdBy']
        );
      }

      if (!command.points || command.points <= 0) {
        return CommandResult.failure<LoyaltyTransactionData>(
          'Points must be a positive number',
          ['points']
        );
      }

      const adjustData: AdjustPointsData = {
        userId: command.userId,
        points: command.points,
        isAddition: command.isAddition,
        reason: command.reason,
        createdBy: command.createdBy
      };

      const transaction = await this.loyaltyService.adjustPoints(adjustData);

      const result: LoyaltyTransactionData = {
        transactionId: transaction.transactionId,
        type: transaction.type,
        points: transaction.points.value,
        reason: transaction.reason,
        description: transaction.description,
        balanceAfter: transaction.balanceAfter,
        expiresAt: transaction.expiresAt,
        createdAt: transaction.createdAt
      };

      return CommandResult.success<LoyaltyTransactionData>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<LoyaltyTransactionData>(
          'Failed to adjust points',
          [error.message]
        );
      }

      return CommandResult.failure<LoyaltyTransactionData>(
        'An unexpected error occurred while adjusting points'
      );
    }
  }
}
