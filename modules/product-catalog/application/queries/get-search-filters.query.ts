import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService, SearchFilter } from "../services/product-search.service";

export interface GetSearchFiltersQuery extends IQuery {
  readonly query?: string;
  readonly category?: string;
}

export class GetSearchFiltersHandler implements IQueryHandler<GetSearchFiltersQuery, SearchFilter[]> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: GetSearchFiltersQuery): Promise<SearchFilter[]> {
    return this.productSearchService.getAvailableFilters({ query: query.query, category: query.category });
  }
}
