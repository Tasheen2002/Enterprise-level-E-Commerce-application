import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductSearchService, SearchSuggestion } from "../services/product-search.service";

export interface GetSearchSuggestionsInput extends IQuery {
  searchTerm: string;
  limit?: number;
  type?: "products" | "categories" | "brands" | "all";
}

export interface GetSearchSuggestionsResult {
  suggestions: SearchSuggestion[];
  query: string;
  type: string;
  limit: number;
}

export class GetSearchSuggestionsHandler implements IQueryHandler<GetSearchSuggestionsInput, GetSearchSuggestionsResult> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(input: GetSearchSuggestionsInput): Promise<GetSearchSuggestionsResult> {
    const limit = Math.min(50, Math.max(1, input.limit ?? 10));
    const type = input.type ?? "all";
    const searchTerm = input.searchTerm.trim();
    const suggestions = await this.productSearchService.getSearchSuggestions(searchTerm, { limit, type });
    return { suggestions, query: searchTerm, type, limit };
  }
}
