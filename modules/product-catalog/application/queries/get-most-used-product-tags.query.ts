import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetMostUsedProductTagsQuery extends IQuery {
  readonly limit?: number;
}

export class GetMostUsedProductTagsHandler implements IQueryHandler<GetMostUsedProductTagsQuery, Array<{ tag: ProductTagDTO; usageCount: number }>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetMostUsedProductTagsQuery): Promise<Array<{ tag: ProductTagDTO; usageCount: number }>> {
    return this.productTagManagementService.getMostUsedTags(
      Math.min(50, Math.max(1, query.limit ?? 10)),
    );
  }
}
