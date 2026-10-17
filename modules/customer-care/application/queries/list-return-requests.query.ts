import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";

// Base interfaces

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
  implements IQueryHandler<ListReturnRequestsQuery, QueryResult<ReturnRequestDto[]>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(query: ListReturnRequestsQuery): Promise<QueryResult<ReturnRequestDto[]>> {
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
        return QueryResult.failure<ReturnRequestDto[]>("Failed to list return requests", [
          error.message,
        ]);
      }
      return QueryResult.failure<ReturnRequestDto[]>(
        "An unexpected error occurred while listing return requests",
      );
    }
  }
}
