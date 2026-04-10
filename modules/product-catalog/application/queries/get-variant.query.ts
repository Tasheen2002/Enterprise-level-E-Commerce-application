import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface GetVariantInput extends IQuery {
  variantId: string;
}

export class GetVariantHandler implements IQueryHandler<GetVariantInput, ProductVariantDTO> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(input: GetVariantInput): Promise<ProductVariantDTO> {
    return this.variantManagementService.getVariantById(input.variantId);
  }
}
