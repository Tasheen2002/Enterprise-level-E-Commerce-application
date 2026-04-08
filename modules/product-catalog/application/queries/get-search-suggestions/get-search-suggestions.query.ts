import { IQuery } from "@/api/src/shared/application";
import { SearchSuggestion } from "../../services/product-search.service";

export interface GetSearchSuggestionsQuery extends IQuery {
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
