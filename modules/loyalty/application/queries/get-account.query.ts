import { LoyaltyService, LoyaltyAccountData } from '../services/loyalty.service';
import { CommandResult } from '../commands/earn-points.command';

export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = void> {
  handle(query: TQuery): Promise<TResult>;
}

export interface GetAccountQuery extends IQuery {
  userId: string;
}

export class GetAccountHandler implements IQueryHandler<GetAccountQuery, CommandResult<LoyaltyAccountData>> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetAccountQuery): Promise<CommandResult<LoyaltyAccountData>> {
    try {
      if (!query.userId) {
        return CommandResult.failure<LoyaltyAccountData>(
          'User ID is required',
          ['userId']
        );
      }

      const account = await this.loyaltyService.getAccountDetails(query.userId);

      return CommandResult.success<LoyaltyAccountData>(account);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<LoyaltyAccountData>(
          'Failed to retrieve loyalty account',
          [error.message]
        );
      }

      return CommandResult.failure<LoyaltyAccountData>(
        'An unexpected error occurred while retrieving loyalty account'
      );
    }
  }
}
