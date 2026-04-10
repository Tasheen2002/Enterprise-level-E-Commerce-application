import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductSearchService, SearchStatistics } from "../services/product-search.service";

export interface GetSearchStatsInput extends IQuery {}

export class GetSearchStatsHandler implements IQueryHandler<GetSearchStatsInput, SearchStatistics> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(_input: GetSearchStatsInput): Promise<SearchStatistics> {
    return this.productSearchService.getSearchStatistics();
  }
}
