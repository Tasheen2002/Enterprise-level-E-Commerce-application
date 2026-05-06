import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService } from "../services/product-search.service";

export interface GetPopularSearchesQuery extends IQuery {}

export interface PopularSearchResult {
  readonly term: string;
  readonly count: number;
}

export class GetPopularSearchesHandler implements IQueryHandler<GetPopularSearchesQuery, PopularSearchResult[]> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: GetPopularSearchesQuery): Promise<PopularSearchResult[]> {
    return this.productSearchService.getPopularSearches();
  }
}
