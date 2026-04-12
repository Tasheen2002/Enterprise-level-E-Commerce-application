import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder, BackorderDTO } from "../../domain/entities/backorder.entity";

export interface GetBackorderQuery extends IQuery {
  readonly orderItemId: string;
}

export class GetBackorderHandler implements IQueryHandler<GetBackorderQuery, QueryResult<BackorderDTO>> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(query: GetBackorderQuery): Promise<QueryResult<BackorderDTO>> {
    const backorder = await this.backorderService.getBackorderByOrderItemId(query.orderItemId);
    return QueryResult.success(Backorder.toDTO(backorder));
  }
}
