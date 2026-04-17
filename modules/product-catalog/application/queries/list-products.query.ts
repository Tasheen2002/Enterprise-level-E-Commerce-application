import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";

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

export interface ListProductsResult {
  readonly products: ProductDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export class ListProductsHandler implements IQueryHandler<ListProductsQuery, ListProductsResult> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(input: ListProductsQuery): Promise<ListProductsResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const result = await this.productManagementService.getAllProducts({ page, limit, ...input });
    return {
      products: result.items,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}
