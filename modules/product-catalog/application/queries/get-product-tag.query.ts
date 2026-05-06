import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { MissingProductTagIdentifierError } from "../../domain/errors/product-catalog.errors";

export interface GetProductTagQuery extends IQuery {
  readonly id?: string;
  readonly name?: string;
}

export class GetProductTagHandler implements IQueryHandler<GetProductTagQuery, ProductTagDTO> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetProductTagQuery): Promise<ProductTagDTO> {
    if (query.id) {
      return this.productTagManagementService.getTagById(query.id);
    }
    if (query.name) {
      return this.productTagManagementService.getTagByName(query.name);
    }
    throw new MissingProductTagIdentifierError();
  }
}
