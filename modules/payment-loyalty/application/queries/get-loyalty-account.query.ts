import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  LoyaltyService,
  LoyaltyAccountDto,
} from "../services/loyalty.service";

export interface GetLoyaltyAccountQuery extends IQuery {
  userId: string;
  programId: string;
}

export class GetLoyaltyAccountHandler implements IQueryHandler<
  GetLoyaltyAccountQuery,
  QueryResult<LoyaltyAccountDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    query: GetLoyaltyAccountQuery,
  ): Promise<QueryResult<LoyaltyAccountDto>> {
    try {
      if (!query.userId) {
        return QueryResult.failure<LoyaltyAccountDto>("userId is required");
      }
      if (!query.programId) {
        return QueryResult.failure<LoyaltyAccountDto>("programId is required");
      }

      const account = await this.loyaltyService.getLoyaltyAccount(
        query.userId,
        query.programId,
      );
      if (!account) {
        return QueryResult.failure<LoyaltyAccountDto>(
          "Loyalty account not found",
        );
      }
      return QueryResult.success<LoyaltyAccountDto>(account);
    } catch (error) {
      return QueryResult.failure<LoyaltyAccountDto>(
        error instanceof Error ? error.message : "An unexpected error occurred while retrieving loyalty account",
      );
    }
  }
}
