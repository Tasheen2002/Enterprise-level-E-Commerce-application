import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetTagProductsQuery extends IQuery {
  readonly tagId: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface GetTagProductsResult {
  readonly products: string[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly total_pages: number;
  };
}

export class GetTagProductsHandler implements IQueryHandler<GetTagProductsQuery, GetTagProductsResult> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetTagProductsQuery): Promise<GetTagProductsResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const products = await this.productTagManagementService.getTagProducts(query.tagId, {
      limit,
      offset: (page - 1) * limit,
    });

    return { products, pagination: { page, limit, total: products.length, total_pages: Math.ceil(products.length / limit) } };
  }
}
