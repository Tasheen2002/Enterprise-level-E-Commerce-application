import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface GetTagProductsQuery extends IQuery {
  readonly tagId: string;
  readonly page?: number;
  readonly limit?: number;
}

export class GetTagProductsHandler implements IQueryHandler<GetTagProductsQuery, PaginatedResult<string>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetTagProductsQuery): Promise<PaginatedResult<string>> {
    const page = Math.max(MIN_PAGE, query.page ?? MIN_PAGE);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE));

    return this.productTagManagementService.getTagProducts(query.tagId, {
      limit,
      offset: (page - 1) * limit,
    });
  }
}
