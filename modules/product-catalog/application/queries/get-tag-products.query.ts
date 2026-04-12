import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetTagProductsQuery extends IQuery {
  tagId: string;
  page?: number;
  limit?: number;
}

export interface GetTagProductsResult {
  products: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export class GetTagProductsHandler implements IQueryHandler<GetTagProductsQuery, GetTagProductsResult> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetTagProductsQuery): Promise<GetTagProductsResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const result = await this.productTagManagementService.getTagProducts(query.tagId, {
      limit,
      offset: (page - 1) * limit,
    });

    const products = (result as { products?: unknown[] }).products ?? (result as unknown[]);
    const total = (result as { total?: number }).total ?? 0;

    return { products, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  }
}
