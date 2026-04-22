import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { PreorderManagementService } from "../services/preorder-management.service";
import { PreorderDTO } from "../../domain/entities/preorder.entity";
import { PreorderQueryOptions } from "../../domain/repositories/preorder.repository";

export interface ListPreordersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: "releaseDate" | "notifiedAt";
  readonly sortOrder?: "asc" | "desc";
  readonly filterType?: "all" | "notified" | "unnotified" | "released";
}

export class ListPreordersHandler implements IQueryHandler<ListPreordersQuery, PaginatedResult<PreorderDTO>> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(query: ListPreordersQuery): Promise<PaginatedResult<PreorderDTO>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const filterType = query.filterType ?? "all";
    const options: PreorderQueryOptions = {
      limit,
      offset,
      sortBy: query.sortBy ?? "releaseDate",
      sortOrder: query.sortOrder ?? "asc",
    };

    let preorders: PreorderDTO[];
    let total: number;

    switch (filterType) {
      case "notified":
        [preorders, total] = await Promise.all([
          this.preorderService.getNotifiedPreorders(options),
          this.preorderService.getNotifiedCount(),
        ]);
        break;
      case "unnotified":
        [preorders, total] = await Promise.all([
          this.preorderService.getUnnotifiedPreorders(options),
          this.preorderService.getUnnotifiedCount(),
        ]);
        break;
      case "released":
        [preorders, total] = await Promise.all([
          this.preorderService.getReleasedPreorders(options),
          this.preorderService.getReleasedCount(),
        ]);
        break;
      default:
        [preorders, total] = await Promise.all([
          this.preorderService.getAllPreorders(options),
          this.preorderService.getPreorderCount(),
        ]);
    }

    return {
      items: preorders,
      total,
      limit,
      offset,
      hasMore: offset + preorders.length < total,
    };
  }
}
