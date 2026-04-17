import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface ListVariantsQuery extends IQuery {
  readonly productId: string;
  readonly page?: number;
  readonly limit?: number;
  readonly size?: string;
  readonly color?: string;
  readonly sortBy?: "sku" | "createdAt" | "size" | "color";
  readonly sortOrder?: "asc" | "desc";
}

export interface ListVariantsResult {
  readonly variants: ProductVariantDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export class ListVariantsHandler implements IQueryHandler<ListVariantsQuery, ListVariantsResult> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(input: ListVariantsQuery): Promise<ListVariantsResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const result = await this.variantManagementService.getVariantsByProduct(input.productId, {
      page, limit, size: input.size, color: input.color,
      sortBy: input.sortBy ?? "createdAt", sortOrder: input.sortOrder ?? "asc",
    });
    return {
      variants: result.variants,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}
