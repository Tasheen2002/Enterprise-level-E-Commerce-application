import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { RepairService } from "../services/repair.service.js";

// Base interfaces

export interface GetRepairQuery extends IQuery {
  repairId: string;
}

export interface RepairDto {
  repairId: string;
  orderItemId: string;
  notes?: string;
  status?: string;
}

export class GetRepairHandler
  implements IQueryHandler<GetRepairQuery, QueryResult<RepairDto | null>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(query: GetRepairQuery): Promise<QueryResult<RepairDto | null>> {
    try {
      if (!query.repairId) {
        return QueryResult.failure<RepairDto | null>("Repair ID is required", ["repairId"]);
      }

      const repair = await this.repairService.getRepairById(query.repairId);
      if (!repair) {
        return QueryResult.success<RepairDto | null>(null);
      }
      const result: RepairDto = {
        repairId: repair.getRepairId().getValue(),
        orderItemId: repair.getOrderItemId(),
        notes: repair.getNotes(),
        status: repair.getStatus()?.getValue(),
      };
      return QueryResult.success<RepairDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<RepairDto | null>("Failed to get repair", [error.message]);
      }
      return QueryResult.failure<RepairDto | null>(
        "An unexpected error occurred while getting repair",
      );
    }
  }
}
