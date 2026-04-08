import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { VariantManagementService } from "../../services/variant-management.service";
import { GetVariantQuery } from "./get-variant.query";

export interface VariantResult {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  weightG: number | null;
  dims: Record<string, any> | null;
  taxClass: string | null;
  allowBackorder: boolean;
  allowPreorder: boolean;
  restockEta: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetVariantHandler
  implements IQueryHandler<GetVariantQuery, QueryResult<VariantResult | null>>
{
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(query: GetVariantQuery): Promise<QueryResult<VariantResult | null>> {
    try {
      const variant = await this.variantManagementService.getVariantById(query.variantId);

      if (!variant) {
        return QueryResult.success<VariantResult | null>(null);
      }

      return QueryResult.success<VariantResult | null>(variant.toData());
    } catch (error) {
      return QueryResult.failure<VariantResult | null>("Failed to get variant");
    }
  }
}
