import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { BackorderDTO } from "../../domain/entities/backorder.entity";
import { BackorderNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetBackorderQuery extends IQuery {
  readonly orderItemId: string;
}

export class GetBackorderHandler implements IQueryHandler<GetBackorderQuery, BackorderDTO> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(query: GetBackorderQuery): Promise<BackorderDTO> {
    const backorder = await this.backorderService.getBackorderByOrderItemId(query.orderItemId);
    if (!backorder) throw new BackorderNotFoundError(query.orderItemId);
    return backorder;
  }
}
