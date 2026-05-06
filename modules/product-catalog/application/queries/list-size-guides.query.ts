import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/value-objects";
import { SizeGuideManagementService } from "../services/size-guide-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface ListSizeGuidesQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly region?: Region;
  readonly category?: string;
  readonly hasContent?: boolean;
  readonly sortBy?: "title" | "region" | "category";
  readonly sortOrder?: "asc" | "desc";
}

export class ListSizeGuidesHandler implements IQueryHandler<ListSizeGuidesQuery, PaginatedResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: ListSizeGuidesQuery): Promise<PaginatedResult<SizeGuideDTO>> {
    return this.sizeGuideManagementService.findWithFilters(
      { region: query.region, category: query.category, hasContent: query.hasContent },
      {
        page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
        limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    );
  }
}
