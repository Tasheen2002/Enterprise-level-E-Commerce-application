import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface GetVariantQuery extends IQuery {
  readonly variantId: string;
}

export class GetVariantHandler implements IQueryHandler<GetVariantQuery, ProductVariantDTO> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(query: GetVariantQuery): Promise<ProductVariantDTO> {
    return this.variantManagementService.getVariantById(query.variantId);
  }
}
