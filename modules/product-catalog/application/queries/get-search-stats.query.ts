import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService, SearchStatistics } from "../services/product-search.service";

export interface GetSearchStatsQuery extends IQuery {}

export class GetSearchStatsHandler implements IQueryHandler<GetSearchStatsQuery, SearchStatistics> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(_input: GetSearchStatsQuery): Promise<SearchStatistics> {
    return this.productSearchService.getSearchStatistics();
  }
}
