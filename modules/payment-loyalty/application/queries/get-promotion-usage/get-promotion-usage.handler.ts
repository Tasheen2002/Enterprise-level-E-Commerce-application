import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  PromotionService,
  PromotionUsageDto,
} from "../../services/promotion.service";
import { GetPromotionUsageQuery } from "./get-promotion-usage.query";

export class GetPromotionUsageHandler implements IQueryHandler<
  GetPromotionUsageQuery,
  QueryResult<PromotionUsageDto[]>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(
    query: GetPromotionUsageQuery,
  ): Promise<QueryResult<PromotionUsageDto[]>> {
    try {
      const usage = await this.promotionService.getPromotionUsage(
        query.promoId,
      );
      return QueryResult.success<PromotionUsageDto[]>(usage);
    } catch (error) {
      return QueryResult.failure<PromotionUsageDto[]>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving promotion usage",
      );
    }
  }
}
