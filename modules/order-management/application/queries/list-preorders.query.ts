import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder, PreorderDTO } from "../../domain/entities/preorder.entity";
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

    let preorders: Preorder[];
    let total: number;

    switch (filterType) {
      case "notified":
        preorders = await this.preorderService.getNotifiedPreorders(options);
        total = await this.preorderService.getNotifiedCount();
        break;
      case "unnotified":
        preorders = await this.preorderService.getUnnotifiedPreorders(options);
        total = await this.preorderService.getUnnotifiedCount();
        break;
      case "released":
        preorders = await this.preorderService.getReleasedPreorders(options);
        total = await this.preorderService.getReleasedCount();
        break;
      default:
        preorders = await this.preorderService.getAllPreorders(options);
        total = await this.preorderService.getPreorderCount();
    }

    return {
      items: preorders.map(Preorder.toDTO),
      total,
      limit,
      offset,
      hasMore: offset + preorders.length < total,
    };
  }
}
