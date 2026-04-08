import { GoodwillRecordService } from "../services/goodwill-record.service.js";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "./get-support-ticket.query.js";

export interface GetGoodwillRecordQuery extends IQuery {
  goodwillId: string;
}

export interface GoodwillRecordDto {
  goodwillId: string;
  userId?: string;
  orderId?: string;
  type: string;
  value: number;
  reason?: string;
  createdAt: Date;
}

export class GetGoodwillRecordHandler
  implements
    IQueryHandler<GetGoodwillRecordQuery, QueryResult<GoodwillRecordDto | null>>
{
  constructor(private readonly goodwillRecordService: GoodwillRecordService) {}

  async handle(
    query: GetGoodwillRecordQuery
  ): Promise<QueryResult<GoodwillRecordDto | null>> {
    try {
      if (!query.goodwillId) {
        return QueryResult.failure<GoodwillRecordDto | null>(
          "Goodwill ID is required",
          ["goodwillId"]
        );
      }

      const record = await this.goodwillRecordService.getRecord(
        query.goodwillId
      );
      if (!record) {
        return QueryResult.success<GoodwillRecordDto | null>(null);
      }
      const result: GoodwillRecordDto = {
        goodwillId: record.getGoodwillId().getValue(),
        userId: record.getUserId(),
        orderId: record.getOrderId(),
        type: record.getType().getValue(),
        value: record.getValue().getAmount(),
        reason: record.getReason(),
        createdAt: record.getCreatedAt(),
      };
      return QueryResult.success<GoodwillRecordDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<GoodwillRecordDto | null>(
          "Failed to get goodwill record",
          [error.message]
        );
      }
      return QueryResult.failure<GoodwillRecordDto | null>(
        "An unexpected error occurred while getting goodwill record"
      );
    }
  }
}
