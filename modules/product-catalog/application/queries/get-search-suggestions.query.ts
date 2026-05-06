import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService, SearchSuggestion } from "../services/product-search.service";
import { DEFAULT_SUGGESTIONS_LIMIT, MAX_SUGGESTIONS_LIMIT, MIN_LIMIT } from "../../domain/constants/pagination.constants";

export interface GetSearchSuggestionsQuery extends IQuery {
  readonly searchTerm: string;
  readonly limit?: number;
  readonly type?: "products" | "categories" | "brands" | "all";
}

export interface GetSearchSuggestionsResult {
  readonly suggestions: SearchSuggestion[];
  readonly query: string;
  readonly type: string;
  readonly limit: number;
}

export class GetSearchSuggestionsHandler implements IQueryHandler<GetSearchSuggestionsQuery, GetSearchSuggestionsResult> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: GetSearchSuggestionsQuery): Promise<GetSearchSuggestionsResult> {
    const limit = Math.min(MAX_SUGGESTIONS_LIMIT, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_SUGGESTIONS_LIMIT));
    const type = query.type ?? "all";
    const searchTerm = query.searchTerm.trim();
    const suggestions = await this.productSearchService.getSearchSuggestions(searchTerm, { limit, type });
    return { suggestions, query: searchTerm, type, limit };
  }
}
