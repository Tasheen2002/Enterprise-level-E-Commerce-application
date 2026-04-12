import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService } from "../services/product-search.service";

export interface GetPopularSearchesQuery extends IQuery {}

export interface PopularSearchResult {
  term: string;
  count: number;
}

export class GetPopularSearchesHandler implements IQueryHandler<GetPopularSearchesQuery, PopularSearchResult[]> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(_input: GetPopularSearchesQuery): Promise<PopularSearchResult[]> {
    return await this.productSearchService.getPopularSearches();
  }
}
