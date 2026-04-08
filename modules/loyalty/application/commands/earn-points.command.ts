import { LoyaltyService, EarnPointsData, LoyaltyTransactionData } from '../services/loyalty.service';
import { TransactionReason } from '../../domain/entities/loyalty-transaction.entity';

export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

export interface EarnPointsCommand extends ICommand {
  userId: string;
  points: number;
  reason: TransactionReason;
  description?: string;
  referenceId?: string;
  orderId?: string;
}

export class EarnPointsHandler implements ICommandHandler<EarnPointsCommand, CommandResult<LoyaltyTransactionData>> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: EarnPointsCommand): Promise<CommandResult<LoyaltyTransactionData>> {
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

      const earnData: EarnPointsData = {
        userId: command.userId,
        points: command.points,
        reason: command.reason,
        description: command.description,
        referenceId: command.referenceId,
        orderId: command.orderId
      };

      const transaction = await this.loyaltyService.earnPoints(earnData);

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
          'Failed to earn points',
          [error.message]
        );
      }

      return CommandResult.failure<LoyaltyTransactionData>(
        'An unexpected error occurred while earning points'
      );
    }
  }
}
