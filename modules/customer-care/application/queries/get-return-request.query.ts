import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";

// Base interfaces

export interface GetReturnRequestQuery extends IQuery {
  rmaId: string;
}

export interface ReturnRequestDto {
  rmaId: string;
  orderId: string;
  type: string;
  reason?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetReturnRequestHandler
  implements IQueryHandler<GetReturnRequestQuery, QueryResult<ReturnRequestDto | null>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(query: GetReturnRequestQuery): Promise<QueryResult<ReturnRequestDto | null>> {
    try {
      if (!query.rmaId) {
        return QueryResult.failure<ReturnRequestDto | null>("RMA ID is required", ["rmaId"]);
      }

      const request = await this.returnRequestService.getReturnRequest(query.rmaId);
      if (!request) {
        return QueryResult.success<ReturnRequestDto | null>(null);
      }
      const result: ReturnRequestDto = {
        rmaId: request.getRmaId().getValue(),
        orderId: request.getOrderId(),
        type: request.getType().getValue(),
        reason: request.getReason(),
        status: request.getStatus().getValue(),
        createdAt: request.getCreatedAt(),
        updatedAt: request.getUpdatedAt(),
      };
      return QueryResult.success<ReturnRequestDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ReturnRequestDto | null>("Failed to get return request", [
          error.message,
        ]);
      }
      return QueryResult.failure<ReturnRequestDto | null>(
        "An unexpected error occurred while getting return request",
      );
    }
  }
}
