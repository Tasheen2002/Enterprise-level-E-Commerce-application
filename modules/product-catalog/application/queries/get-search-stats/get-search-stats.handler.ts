import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ProductSearchService } from "../../services/product-search.service";
import { GetSearchStatsQuery, GetSearchStatsResult } from "./get-search-stats.query";

export class GetSearchStatsHandler
  implements IQueryHandler<GetSearchStatsQuery, QueryResult<GetSearchStatsResult>>
{
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(_query: GetSearchStatsQuery): Promise<QueryResult<GetSearchStatsResult>> {
    try {
      const stats = await this.productSearchService.getSearchStatistics();
      return QueryResult.success<GetSearchStatsResult>(stats);
    } catch (error) {
      return QueryResult.failure<GetSearchStatsResult>("Failed to get search statistics");
    }
  }
}
