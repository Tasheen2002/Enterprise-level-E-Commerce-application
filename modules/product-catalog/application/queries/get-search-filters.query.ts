import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService, SearchFilter } from "../services/product-search.service";

export interface GetSearchFiltersQuery extends IQuery {
  query?: string;
  category?: string;
}

export class GetSearchFiltersHandler implements IQueryHandler<GetSearchFiltersQuery, SearchFilter[]> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(input: GetSearchFiltersQuery): Promise<SearchFilter[]> {
    return await this.productSearchService.getAvailableFilters({ query: input.query, category: input.category });
  }
}
