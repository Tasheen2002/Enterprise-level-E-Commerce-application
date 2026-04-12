import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";

export interface ListProductsQuery extends IQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  brand?: string;
  status?: "draft" | "published" | "scheduled" | "archived";
  includeDrafts?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "publishAt";
  sortOrder?: "asc" | "desc";
}

export interface ListProductsResult {
  items: ProductDTO[];
  totalCount: number;
  page: number;
  limit: number;
}

export class ListProductsHandler implements IQueryHandler<ListProductsQuery, ListProductsResult> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(input: ListProductsQuery): Promise<ListProductsResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const result = await this.productManagementService.getAllProducts({ page, limit, ...input });
    return { items: result.items, totalCount: result.totalCount, page, limit };
  }
}
