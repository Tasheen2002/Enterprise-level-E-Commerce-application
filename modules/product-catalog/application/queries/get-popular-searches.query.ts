import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductSearchService } from "../services/product-search.service";

export interface GetPopularSearchesInput extends IQuery {}

export interface PopularSearchResult {
  term: string;
  count: number;
}

export class GetPopularSearchesHandler implements IQueryHandler<GetPopularSearchesInput, PopularSearchResult[]> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(_input: GetPopularSearchesInput): Promise<PopularSearchResult[]> {
    return this.productSearchService.getPopularSearches();
  }
}
