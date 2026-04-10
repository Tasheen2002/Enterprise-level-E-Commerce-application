import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface ListVariantsInput extends IQuery {
  productId: string;
  page?: number;
  limit?: number;
  size?: string;
  color?: string;
  sortBy?: "sku" | "createdAt" | "size" | "color";
  sortOrder?: "asc" | "desc";
}

export interface ListVariantsResult {
  variants: ProductVariantDTO[];
  meta: {
    productId: string;
    page: number;
    limit: number;
    filters: { size?: string; color?: string };
  };
}

export class ListVariantsHandler implements IQueryHandler<ListVariantsInput, ListVariantsResult> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(input: ListVariantsInput): Promise<ListVariantsResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const variants = await this.variantManagementService.getVariantsByProduct(input.productId, {
      page, limit, size: input.size, color: input.color,
      sortBy: input.sortBy ?? "createdAt", sortOrder: input.sortOrder ?? "asc",
    });
    return {
      variants,
      meta: { productId: input.productId, page, limit, filters: { size: input.size, color: input.color } },
    };
  }
}
