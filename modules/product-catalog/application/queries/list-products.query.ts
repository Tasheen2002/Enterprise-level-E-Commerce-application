import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface ListProductsQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly categoryId?: string;
  readonly brand?: string;
  readonly status?: "draft" | "published" | "scheduled" | "archived";
  readonly includeDrafts?: boolean;
  readonly sortBy?: "title" | "createdAt" | "updatedAt" | "publishAt";
  readonly sortOrder?: "asc" | "desc";
}

export class ListProductsHandler implements IQueryHandler<ListProductsQuery, PaginatedResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(query: ListProductsQuery): Promise<PaginatedResult<ProductDTO>> {
    const page = Math.max(MIN_PAGE, query.page ?? MIN_PAGE);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE));
    return this.productManagementService.getAllProducts({
      page,
      limit,
      categoryId: query.categoryId,
      brand: query.brand,
      status: query.status,
      includeDrafts: query.includeDrafts,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
