import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ProductSearchService } from "../../services/product-search.service";
import { GetSearchSuggestionsQuery, GetSearchSuggestionsResult } from "./get-search-suggestions.query";

export class GetSearchSuggestionsHandler
  implements IQueryHandler<GetSearchSuggestionsQuery, QueryResult<GetSearchSuggestionsResult>>
{
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: GetSearchSuggestionsQuery): Promise<QueryResult<GetSearchSuggestionsResult>> {
    try {
      const limit = Math.min(50, Math.max(1, query.limit || 10));
      const type = query.type || "all";
      const searchTerm = query.searchTerm.trim();

      const suggestions = await this.productSearchService.getSearchSuggestions(searchTerm, {
        limit,
        type,
      });

      return QueryResult.success<GetSearchSuggestionsResult>({
        suggestions,
        query: searchTerm,
        type,
        limit,
      });
    } catch (error) {
      return QueryResult.failure<GetSearchSuggestionsResult>("Failed to get search suggestions");
    }
  }
}
