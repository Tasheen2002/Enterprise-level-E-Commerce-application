import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { DomainValidationError } from "../../domain/errors/product-catalog.errors";

export interface GetProductInput extends IQuery {
  productId?: string;
  slug?: string;
}

export class GetProductHandler implements IQueryHandler<GetProductInput, ProductDTO> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(input: GetProductInput): Promise<ProductDTO> {
    if (!input.productId && !input.slug) {
      throw new DomainValidationError("Either productId or slug is required");
    }
    if (input.productId) {
      return this.productManagementService.getProductById(input.productId);
    }
    return this.productManagementService.getProductBySlug(input.slug!);
  }
}
