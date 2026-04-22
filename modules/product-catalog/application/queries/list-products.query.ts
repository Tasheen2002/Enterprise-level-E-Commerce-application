import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

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

  async handle(input: ListProductsQuery): Promise<PaginatedResult<ProductDTO>> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    return this.productManagementService.getAllProducts({ page, limit, ...input });
  }
}
