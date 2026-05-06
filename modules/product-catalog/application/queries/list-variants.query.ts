import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface ListVariantsQuery extends IQuery {
  readonly productId: string;
  readonly page?: number;
  readonly limit?: number;
  readonly size?: string;
  readonly color?: string;
  readonly sortBy?: "sku" | "createdAt" | "size" | "color";
  readonly sortOrder?: "asc" | "desc";
}

export class ListVariantsHandler implements IQueryHandler<ListVariantsQuery, PaginatedResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(query: ListVariantsQuery): Promise<PaginatedResult<ProductVariantDTO>> {
    return this.variantManagementService.getVariantsByProduct(query.productId, {
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      size: query.size,
      color: query.color,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
