import { ReturnRequestService } from "../services/return-request.service.js";

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

export interface ListReturnRequestsQuery extends IQuery {}

export interface ReturnRequestDto {
  rmaId: string;
  orderId: string;
  type: string;
  reason?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListReturnRequestsHandler
  implements
    IQueryHandler<ListReturnRequestsQuery, QueryResult<ReturnRequestDto[]>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(
    query: ListReturnRequestsQuery
  ): Promise<QueryResult<ReturnRequestDto[]>> {
    try {
      const requests = await this.returnRequestService.getAllReturnRequests();
      const result: ReturnRequestDto[] = requests.map((request) => ({
        rmaId: request.getRmaId().getValue(),
        orderId: request.getOrderId(),
        type: request.getType().getValue(),
        reason: request.getReason(),
        status: request.getStatus().getValue(),
        createdAt: request.getCreatedAt(),
        updatedAt: request.getUpdatedAt(),
      }));
      return QueryResult.success<ReturnRequestDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ReturnRequestDto[]>(
          "Failed to list return requests",
          [error.message]
        );
      }
      return QueryResult.failure<ReturnRequestDto[]>(
        "An unexpected error occurred while listing return requests"
      );
    }
  }
}
