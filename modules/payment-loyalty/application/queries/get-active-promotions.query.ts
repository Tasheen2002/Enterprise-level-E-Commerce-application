import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  PromotionService,
  PromotionDto,
} from "../services/promotion.service";

export interface GetActivePromotionsQuery extends IQuery {}

export class GetActivePromotionsHandler implements IQueryHandler<
  GetActivePromotionsQuery,
  QueryResult<PromotionDto[]>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(
    _query: GetActivePromotionsQuery,
  ): Promise<QueryResult<PromotionDto[]>> {
    try {
      const promotions = await this.promotionService.getActivePromotions();
      return QueryResult.success<PromotionDto[]>(promotions);
    } catch (error) {
      return QueryResult.failure<PromotionDto[]>(
        error instanceof Error ? error.message : "An unexpected error occurred while retrieving active promotions",
      );
    }
  }
}
