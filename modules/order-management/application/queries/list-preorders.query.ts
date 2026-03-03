import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { PreorderManagementService } from "../services/preorder-management.service";
import { PreorderQueryOptions } from "../../domain/repositories/preorder.repository";
import { Preorder } from "../../domain/entities/preorder.entity";

export interface ListPreordersQuery extends IQuery {
  limit?: number;
  offset?: number;
  sortBy?: "releaseDate" | "notifiedAt";
  sortOrder?: "asc" | "desc";
  filterType?: "all" | "notified" | "unnotified" | "released";
}

export interface PreorderResult {
  orderItemId: string;
  releaseDate?: Date;
  notifiedAt?: Date;
  hasReleaseDate: boolean;
  isCustomerNotified: boolean;
  isReleased: boolean;
}

export interface ListPreordersResult {
  items: PreorderResult[];
  total: number;
  limit: number;
  offset: number;
}

export class ListPreordersHandler implements IQueryHandler<
  ListPreordersQuery,
  QueryResult<ListPreordersResult>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    query: ListPreordersQuery,
  ): Promise<QueryResult<ListPreordersResult>> {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = "releaseDate",
        sortOrder = "asc",
        filterType = "all",
      } = query;

      const options: PreorderQueryOptions = {
        limit,
        offset,
        sortBy,
        sortOrder,
      };

      // Get preorders based on filter type
      let preorders: Preorder[];
      let total: number;

      switch (filterType) {
        case "notified":
          preorders = await this.preorderService.getNotifiedPreorders(options);
          total = await this.preorderService.getNotifiedCount();
          break;
        case "unnotified":
          preorders =
            await this.preorderService.getUnnotifiedPreorders(options);
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

      const items: PreorderResult[] = preorders.map((preorder) => ({
        orderItemId: preorder.getOrderItemId(),
        releaseDate: preorder.getReleaseDate(),
        notifiedAt: preorder.getNotifiedAt(),
        hasReleaseDate: preorder.hasReleaseDate(),
        isCustomerNotified: preorder.isCustomerNotified(),
        isReleased: preorder.isReleased(),
      }));

      const result: ListPreordersResult = {
        items,
        total,
        limit,
        offset,
      };

      return QueryResult.success<ListPreordersResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ListPreordersResult>(
          `Failed to retrieve preorders: ${error.message}`,
        );
      }

      return QueryResult.failure<ListPreordersResult>(
        "An unexpected error occurred while retrieving preorders",
      );
    }
  }
}
