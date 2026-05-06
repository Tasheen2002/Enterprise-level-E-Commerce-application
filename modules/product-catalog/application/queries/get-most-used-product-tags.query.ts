import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { DEFAULT_SUGGESTIONS_LIMIT, MAX_SUGGESTIONS_LIMIT, MIN_LIMIT } from "../../domain/constants/pagination.constants";

export interface GetMostUsedProductTagsQuery extends IQuery {
  readonly limit?: number;
}

export interface MostUsedProductTagResult {
  readonly tag: ProductTagDTO;
  readonly usageCount: number;
}

export class GetMostUsedProductTagsHandler implements IQueryHandler<GetMostUsedProductTagsQuery, MostUsedProductTagResult[]> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetMostUsedProductTagsQuery): Promise<MostUsedProductTagResult[]> {
    return this.productTagManagementService.getMostUsedTags(
      Math.min(MAX_SUGGESTIONS_LIMIT, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_SUGGESTIONS_LIMIT)),
    );
  }
}
