import { LoyaltyService, LoyaltyTransactionData } from '../services/loyalty.service';
import { CommandResult } from '../commands/earn-points.command';
import { IQuery, IQueryHandler } from './get-account.query';

export interface GetTransactionsQuery extends IQuery {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface TransactionHistoryResult {
  transactions: LoyaltyTransactionData[];
  limit: number;
  offset: number;
}

export class GetTransactionsHandler implements IQueryHandler<GetTransactionsQuery, CommandResult<TransactionHistoryResult>> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetTransactionsQuery): Promise<CommandResult<TransactionHistoryResult>> {
    try {
      if (!query.userId) {
        return CommandResult.failure<TransactionHistoryResult>(
          'User ID is required',
          ['userId']
        );
      }

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      const transactions = await this.loyaltyService.getTransactionHistory(
        query.userId,
        limit,
        offset
      );

      const result: TransactionHistoryResult = {
        transactions,
        limit,
        offset
      };

      return CommandResult.success<TransactionHistoryResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<TransactionHistoryResult>(
          'Failed to retrieve transaction history',
          [error.message]
        );
      }

      return CommandResult.failure<TransactionHistoryResult>(
        'An unexpected error occurred while retrieving transaction history'
      );
    }
  }
}
