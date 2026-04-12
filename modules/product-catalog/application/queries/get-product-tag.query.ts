import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetProductTagQuery extends IQuery {
  id?: string;
  name?: string;
}

export class GetProductTagHandler implements IQueryHandler<GetProductTagQuery, ProductTagDTO> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetProductTagQuery): Promise<ProductTagDTO> {
    if (query.id) {
      return await this.productTagManagementService.getTagById(query.id);
    }
    return await this.productTagManagementService.getTagByName(query.name!);
  }
}
