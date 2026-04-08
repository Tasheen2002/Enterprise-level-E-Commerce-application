import { RepairService } from "../services/repair.service.js";

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

export interface ListRepairsQuery extends IQuery {}

export interface RepairDto {
  repairId: string;
  orderItemId: string;
  notes?: string;
  status?: string;
}

export class ListRepairsHandler
  implements IQueryHandler<ListRepairsQuery, QueryResult<RepairDto[]>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(query: ListRepairsQuery): Promise<QueryResult<RepairDto[]>> {
    try {
      const repairs = await this.repairService.getAllRepairs();
      const result: RepairDto[] = repairs.map((repair) => ({
        repairId: repair.getRepairId().getValue(),
        orderItemId: repair.getOrderItemId(),
        notes: repair.getNotes(),
        status: repair.getStatus()?.getValue(),
      }));
      return QueryResult.success<RepairDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<RepairDto[]>("Failed to list repairs", [
          error.message,
        ]);
      }
      return QueryResult.failure<RepairDto[]>(
        "An unexpected error occurred while listing repairs"
      );
    }
  }
}
