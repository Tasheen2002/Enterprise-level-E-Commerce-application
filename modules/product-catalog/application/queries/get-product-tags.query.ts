import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetProductTagsQuery extends IQuery {
  readonly productId: string;
}

export class GetProductTagsHandler implements IQueryHandler<GetProductTagsQuery, ProductTagDTO[]> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetProductTagsQuery): Promise<ProductTagDTO[]> {
    return this.productTagManagementService.getProductTags(query.productId);
  }
}
