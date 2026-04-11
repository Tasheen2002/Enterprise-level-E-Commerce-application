import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductSearchService, SearchFilter } from "../services/product-search.service";

export interface GetSearchFiltersInput extends IQuery {
  query?: string;
  category?: string;
}

export class GetSearchFiltersHandler implements IQueryHandler<GetSearchFiltersInput, SearchFilter[]> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(input: GetSearchFiltersInput): Promise<SearchFilter[]> {
    return this.productSearchService.getAvailableFilters({ query: input.query, category: input.category });
  }
}
