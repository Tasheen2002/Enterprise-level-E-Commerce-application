import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ProductSearchService } from "../../services/product-search.service";
import { GetPopularSearchesQuery, PopularSearchResult } from "./get-popular-searches.query";

export class GetPopularSearchesHandler
  implements IQueryHandler<GetPopularSearchesQuery, QueryResult<PopularSearchResult[]>>
{
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(_query: GetPopularSearchesQuery): Promise<QueryResult<PopularSearchResult[]>> {
    try {
      const popularSearches = await this.productSearchService.getPopularSearches();
      return QueryResult.success<PopularSearchResult[]>(popularSearches);
    } catch (error) {
      return QueryResult.failure<PopularSearchResult[]>("Failed to get popular searches");
    }
  }
}
