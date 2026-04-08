import { GoodwillRecordService } from "../services/goodwill-record.service.js";

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
  implements
    IQueryHandler<ListGoodwillRecordsQuery, QueryResult<GoodwillRecordDto[]>>
{
  constructor(private readonly goodwillRecordService: GoodwillRecordService) {}

  async handle(
    query: ListGoodwillRecordsQuery
  ): Promise<QueryResult<GoodwillRecordDto[]>> {
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
        return QueryResult.failure<GoodwillRecordDto[]>(
          "Failed to list goodwill records",
          [error.message]
        );
      }
      return QueryResult.failure<GoodwillRecordDto[]>(
        "An unexpected error occurred while listing goodwill records"
      );
    }
  }
}
