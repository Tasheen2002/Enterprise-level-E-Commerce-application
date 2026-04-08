import { ReturnItemService } from "../services/return-item.service.js";

// Base interfaces
export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = void> {
  handle(query: TQuery): Promise<TResult>;
}

export class QueryResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): QueryResult<T> {
    return new QueryResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): QueryResult<T> {
    return new QueryResult<T>(false, undefined, error, errors);
  }
}

export interface GetReturnItemQuery extends IQuery {
  rmaId: string;
  orderItemId: string;
}

// New query for getting all items for an RMA
export interface GetReturnItemsQuery extends IQuery {
  rmaId: string;
}

export interface ReturnItemDto {
  rmaId: string;
  orderItemId: string;
  quantity: number;
  condition?: string;
  disposition?: string;
  fees?: number;
}

export class GetReturnItemHandler
  implements
    IQueryHandler<GetReturnItemQuery, QueryResult<ReturnItemDto | null>>
{
  constructor(private readonly returnItemService: ReturnItemService) {}

  async handle(
    query: GetReturnItemQuery
  ): Promise<QueryResult<ReturnItemDto | null>> {
    try {
      if (!query.rmaId) {
        return QueryResult.failure<ReturnItemDto | null>("RMA ID is required", [
          "rmaId",
        ]);
      }
      if (!query.orderItemId) {
        return QueryResult.failure<ReturnItemDto | null>(
          "Order Item ID is required",
          ["orderItemId"]
        );
      }

      const item = await this.returnItemService.getItem(
        query.rmaId,
        query.orderItemId
      );
      if (!item) {
        return QueryResult.success<ReturnItemDto | null>(null);
      }
      const result: ReturnItemDto = {
        rmaId: item.getRmaId(),
        orderItemId: item.getOrderItemId(),
        quantity: item.getQuantity(),
        condition: item.getCondition()?.getValue(),
        disposition: item.getDisposition()?.getValue(),
        fees: item.getFees()?.getAmount(),
      };
      return QueryResult.success<ReturnItemDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ReturnItemDto | null>(
          "Failed to get return item",
          [error.message]
        );
      }
      return QueryResult.failure<ReturnItemDto | null>(
        "An unexpected error occurred while getting return item"
      );
    }
  }
}

// New handler for getting all return items for an RMA
export class GetReturnItemsHandler
  implements IQueryHandler<GetReturnItemsQuery, QueryResult<ReturnItemDto[]>>
{
  constructor(private readonly returnItemService: ReturnItemService) {}

  async handle(
    query: GetReturnItemsQuery
  ): Promise<QueryResult<ReturnItemDto[]>> {
    try {
      if (!query.rmaId) {
        return QueryResult.failure<ReturnItemDto[]>("RMA ID is required", [
          "rmaId",
        ]);
      }

      const items = await this.returnItemService.getItemsByRmaId(query.rmaId);

      const result: ReturnItemDto[] = items.map((item) => ({
        rmaId: item.getRmaId(),
        orderItemId: item.getOrderItemId(),
        quantity: item.getQuantity(),
        condition: item.getCondition()?.getValue(),
        disposition: item.getDisposition()?.getValue(),
        fees: item.getFees()?.getAmount(),
      }));

      return QueryResult.success<ReturnItemDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ReturnItemDto[]>(
          "Failed to get return items",
          [error.message]
        );
      }
      return QueryResult.failure<ReturnItemDto[]>(
        "An unexpected error occurred while getting return items"
      );
    }
  }
}
