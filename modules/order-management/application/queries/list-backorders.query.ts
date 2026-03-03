import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { BackorderManagementService } from "../services/backorder-management.service";
import { BackorderQueryOptions } from "../../domain/repositories/backorder.repository";
import { Backorder } from "../../domain/entities/backorder.entity";

export interface ListBackordersQuery extends IQuery {
  limit?: number;
  offset?: number;
  sortBy?: "promisedEta" | "notifiedAt";
  sortOrder?: "asc" | "desc";
  filterType?: "all" | "notified" | "unnotified" | "overdue";
}

export interface BackorderResult {
  orderItemId: string;
  promisedEta?: Date;
  notifiedAt?: Date;
  hasPromisedEta: boolean;
  isCustomerNotified: boolean;
}

export interface ListBackordersResult {
  items: BackorderResult[];
  total: number;
  limit: number;
  offset: number;
}

export class ListBackordersHandler implements IQueryHandler<
  ListBackordersQuery,
  QueryResult<ListBackordersResult>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    query: ListBackordersQuery,
  ): Promise<QueryResult<ListBackordersResult>> {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = "promisedEta",
        sortOrder = "asc",
        filterType = "all",
      } = query;

      const options: BackorderQueryOptions = {
        limit,
        offset,
        sortBy,
        sortOrder,
      };

      // Get backorders based on filter type
      let backorders: Backorder[];
      let total: number;

      switch (filterType) {
        case "notified":
          backorders =
            await this.backorderService.getNotifiedBackorders(options);
          total = await this.backorderService.getNotifiedCount();
          break;
        case "unnotified":
          backorders =
            await this.backorderService.getUnnotifiedBackorders(options);
          total = await this.backorderService.getUnnotifiedCount();
          break;
        case "overdue":
          backorders =
            await this.backorderService.getBackordersOverdue(options);
          // Count overdue items
          const allOverdue = await this.backorderService.getBackordersOverdue();
          total = allOverdue.length;
          break;
        default:
          backorders = await this.backorderService.getAllBackorders(options);
          total = await this.backorderService.getBackorderCount();
      }

      const items: BackorderResult[] = backorders.map((backorder) => ({
        orderItemId: backorder.getOrderItemId(),
        promisedEta: backorder.getPromisedEta(),
        notifiedAt: backorder.getNotifiedAt(),
        hasPromisedEta: backorder.hasPromisedEta(),
        isCustomerNotified: backorder.isCustomerNotified(),
      }));

      const result: ListBackordersResult = {
        items,
        total,
        limit,
        offset,
      };

      return QueryResult.success<ListBackordersResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ListBackordersResult>(
          `Failed to retrieve backorders: ${error.message}`,
        );
      }

      return QueryResult.failure<ListBackordersResult>(
        "An unexpected error occurred while retrieving backorders",
      );
    }
  }
}
