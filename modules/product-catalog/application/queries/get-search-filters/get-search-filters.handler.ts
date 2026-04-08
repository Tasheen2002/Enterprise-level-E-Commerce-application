import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ProductSearchService } from "../../services/product-search.service";
import { GetSearchFiltersQuery, GetSearchFiltersResult } from "./get-search-filters.query";

export class GetSearchFiltersHandler
  implements IQueryHandler<GetSearchFiltersQuery, QueryResult<GetSearchFiltersResult>>
{
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: GetSearchFiltersQuery): Promise<QueryResult<GetSearchFiltersResult>> {
    try {
      const filters = await this.productSearchService.getAvailableFilters({
        query: query.query,
        category: query.category,
      });
      return QueryResult.success<GetSearchFiltersResult>(filters);
    } catch (error) {
      return QueryResult.failure<GetSearchFiltersResult>("Failed to get search filters");
    }
  }
}
