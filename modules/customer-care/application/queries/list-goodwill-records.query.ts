import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { GoodwillRecordService } from "../services/goodwill-record.service.js";

// Base interfaces

export interface ListGoodwillRecordsQuery extends IQuery {}

export interface GoodwillRecordDto {
  goodwillId: string;
  userId?: string;
  orderId?: string;
  type: string;
  value: number;
  reason?: string;
  createdAt: Date;
}

export class ListGoodwillRecordsHandler
  implements IQueryHandler<ListGoodwillRecordsQuery, QueryResult<GoodwillRecordDto[]>>
{
  constructor(private readonly goodwillRecordService: GoodwillRecordService) {}

  async handle(query: ListGoodwillRecordsQuery): Promise<QueryResult<GoodwillRecordDto[]>> {
    try {
      const records = await this.goodwillRecordService.getAllRecords();
      const result: GoodwillRecordDto[] = records.map((record) => ({
        goodwillId: record.getGoodwillId().getValue(),
        userId: record.getUserId(),
        orderId: record.getOrderId(),
        type: record.getType().getValue(),
        value: record.getValue().getAmount(),
        reason: record.getReason(),
        createdAt: record.getCreatedAt(),
      }));
      return QueryResult.success<GoodwillRecordDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<GoodwillRecordDto[]>("Failed to list goodwill records", [
          error.message,
        ]);
      }
      return QueryResult.failure<GoodwillRecordDto[]>(
        "An unexpected error occurred while listing goodwill records",
      );
    }
  }
}
