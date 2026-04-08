import { LoyaltyService, RedeemPointsData, LoyaltyTransactionData } from '../services/loyalty.service';
import { TransactionReason } from '../../domain/entities/loyalty-transaction.entity';
import { ICommand, ICommandHandler, CommandResult } from './earn-points.command';

export interface RedeemPointsCommand extends ICommand {
  userId: string;
  points: number;
  reason: TransactionReason;
  description?: string;
  referenceId?: string;
}

export class RedeemPointsHandler implements ICommandHandler<RedeemPointsCommand, CommandResult<LoyaltyTransactionData>> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: RedeemPointsCommand): Promise<CommandResult<LoyaltyTransactionData>> {
    try {
      if (!command.userId || !command.reason) {
        return CommandResult.failure<LoyaltyTransactionData>(
          'User ID and reason are required',
          ['userId', 'reason']
        );
      }

      if (!command.points || command.points <= 0) {
        return CommandResult.failure<LoyaltyTransactionData>(
          'Points must be a positive number',
          ['points']
        );
      }

      const redeemData: RedeemPointsData = {
        userId: command.userId,
        points: command.points,
        reason: command.reason,
        description: command.description,
        referenceId: command.referenceId
      };

      const transaction = await this.loyaltyService.redeemPoints(redeemData);

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
          'Failed to redeem points',
          [error.message]
        );
      }

      return CommandResult.failure<LoyaltyTransactionData>(
        'An unexpected error occurred while redeeming points'
      );
    }
  }
}
