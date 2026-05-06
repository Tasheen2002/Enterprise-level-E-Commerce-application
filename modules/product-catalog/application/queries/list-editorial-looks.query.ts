import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface ListEditorialLooksQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly published?: boolean;
  readonly scheduled?: boolean;
  readonly draft?: boolean;
  readonly hasContent?: boolean;
  readonly sortBy?: "title" | "publishedAt" | "id";
  readonly sortOrder?: "asc" | "desc";
}

export class ListEditorialLooksHandler implements IQueryHandler<ListEditorialLooksQuery, PaginatedResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: ListEditorialLooksQuery): Promise<PaginatedResult<EditorialLookDTO>> {
    return this.editorialLookManagementService.findWithFilters(
      {
        published: query.published,
        scheduled: query.scheduled,
        draft: query.draft,
        hasContent: query.hasContent,
      },
      {
        page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
        limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    );
  }
}
