import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { ProductTagQueryOptions } from "../../domain/repositories/product-tag.repository";

export interface ListProductTagsQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly kind?: string;
  readonly sortBy?: "tag" | "kind";
  readonly sortOrder?: "asc" | "desc";
}

export interface ListProductTagsResult {
  readonly tags: ProductTagDTO[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly total_pages: number;
  };
}

export class ListProductTagsHandler implements IQueryHandler<ListProductTagsQuery, ListProductTagsResult> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: ListProductTagsQuery): Promise<ListProductTagsResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const serviceOptions: ProductTagQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: query.sortBy ?? "tag",
      sortOrder: query.sortOrder ?? "asc",
    };

    const result = query.kind
      ? await this.productTagManagementService.getTagsByKind(query.kind, serviceOptions)
      : await this.productTagManagementService.getAllTags(serviceOptions);

    return { tags: result.tags, pagination: { page, limit, total: result.total, total_pages: Math.ceil(result.total / limit) } };
  }
}
