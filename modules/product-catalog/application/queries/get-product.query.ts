import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { MissingProductIdentifierError } from "../../domain/errors/product-catalog.errors";

export interface GetProductQuery extends IQuery {
  readonly productId?: string;
  readonly slug?: string;
}

export class GetProductHandler implements IQueryHandler<GetProductQuery, ProductDTO> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(query: GetProductQuery): Promise<ProductDTO> {
    if (query.productId) {
      return this.productManagementService.getProductById(query.productId);
    }
    if (query.slug) {
      return this.productManagementService.getProductBySlug(query.slug);
    }
    throw new MissingProductIdentifierError();
  }
}
