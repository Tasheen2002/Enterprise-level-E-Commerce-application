import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { BackorderManagementService } from "../services/backorder-management.service";
import { BackorderDTO } from "../../domain/entities/backorder.entity";
import { BackorderQueryOptions } from "../../domain/repositories/backorder.repository";

export interface ListBackordersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: "promisedEta" | "notifiedAt";
  readonly sortOrder?: "asc" | "desc";
  readonly filterType?: "all" | "notified" | "unnotified" | "overdue";
}

export class ListBackordersHandler implements IQueryHandler<ListBackordersQuery, PaginatedResult<BackorderDTO>> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(query: ListBackordersQuery): Promise<PaginatedResult<BackorderDTO>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const filterType = query.filterType ?? "all";
    const options: BackorderQueryOptions = {
      limit,
      offset,
      sortBy: query.sortBy ?? "promisedEta",
      sortOrder: query.sortOrder ?? "asc",
    };

    let backorders: BackorderDTO[];
    let total: number;

    switch (filterType) {
      case "notified":
        [backorders, total] = await Promise.all([
          this.backorderService.getNotifiedBackorders(options),
          this.backorderService.getNotifiedCount(),
        ]);
        break;
      case "unnotified":
        [backorders, total] = await Promise.all([
          this.backorderService.getUnnotifiedBackorders(options),
          this.backorderService.getUnnotifiedCount(),
        ]);
        break;
      case "overdue":
        [backorders, total] = await Promise.all([
          this.backorderService.getBackordersOverdue(options),
          this.backorderService.getOverdueCount(),
        ]);
        break;
      default:
        backorders = await this.backorderService.getAllBackorders(options);
        total = await this.backorderService.getBackorderCount();
    }

    return {
      items: backorders,
      total,
      limit,
      offset,
      hasMore: offset + backorders.length < total,
    };
  }
}
