import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface GetEditorialLooksByProductQuery extends IQuery {
  readonly productId: string;
  readonly page?: number;
  readonly limit?: number;
  readonly includeUnpublished?: boolean;
  readonly sortBy?: "title" | "publishedAt" | "id";
  readonly sortOrder?: "asc" | "desc";
}

export class GetEditorialLooksByProductHandler implements IQueryHandler<GetEditorialLooksByProductQuery, PaginatedResult<EditorialLookDTO>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetEditorialLooksByProductQuery): Promise<PaginatedResult<EditorialLookDTO>> {
    return this.editorialLookManagementService.getLooksByProduct(query.productId, {
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      includeUnpublished: query.includeUnpublished,
    });
  }
}
