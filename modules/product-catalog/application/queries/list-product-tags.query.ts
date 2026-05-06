import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { ProductTagQueryOptions } from "../../domain/repositories/product-tag.repository";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface ListProductTagsQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly kind?: string;
  readonly sortBy?: "tag" | "kind";
  readonly sortOrder?: "asc" | "desc";
}

export class ListProductTagsHandler implements IQueryHandler<ListProductTagsQuery, PaginatedResult<ProductTagDTO>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: ListProductTagsQuery): Promise<PaginatedResult<ProductTagDTO>> {
    const page = Math.max(MIN_PAGE, query.page ?? MIN_PAGE);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE));

    const serviceOptions: ProductTagQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: query.sortBy ?? "tag",
      sortOrder: query.sortOrder ?? "asc",
    };

    return query.kind
      ? this.productTagManagementService.getTagsByKind(query.kind, serviceOptions)
      : this.productTagManagementService.getAllTags(serviceOptions);
  }
}
