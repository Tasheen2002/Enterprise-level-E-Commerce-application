import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { LoyaltyService, LoyaltyAccountDto } from "../../services/loyalty.service";
import { GetLoyaltyAccountQuery } from "./get-loyalty-account.query";

export class GetLoyaltyAccountHandler implements IQueryHandler<
  GetLoyaltyAccountQuery,
  QueryResult<LoyaltyAccountDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    query: GetLoyaltyAccountQuery,
  ): Promise<QueryResult<LoyaltyAccountDto>> {
    try {
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
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving loyalty account",
      );
    }
  }
}
