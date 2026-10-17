import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { RepairService } from "../services/repair.service.js";

// Base interfaces

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
        return QueryResult.failure<RepairDto[]>("Failed to list repairs", [error.message]);
      }
      return QueryResult.failure<RepairDto[]>("An unexpected error occurred while listing repairs");
    }
  }
}
