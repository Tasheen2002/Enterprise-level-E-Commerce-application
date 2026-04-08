import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GiftCardService } from "../../services/gift-card.service";
import { GetGiftCardBalanceQuery } from "./get-gift-card-balance.query";

export class GetGiftCardBalanceHandler implements IQueryHandler<
  GetGiftCardBalanceQuery,
  QueryResult<number>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(query: GetGiftCardBalanceQuery): Promise<QueryResult<number>> {
    try {
      const balance = await this.giftCardService.getGiftCardBalance(
        query.codeOrId,
      );
      if (balance === null) {
        return QueryResult.failure<number>("Gift card not found");
      }
      return QueryResult.success<number>(balance);
    } catch (error) {
      return QueryResult.failure<number>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving gift card balance",
      );
    }
  }
}
