import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder, BackorderDTO } from "../../domain/entities/backorder.entity";

export interface GetBackorderQuery extends IQuery {
  readonly orderItemId: string;
}

export class GetBackorderHandler implements IQueryHandler<GetBackorderQuery, BackorderDTO> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(query: GetBackorderQuery): Promise<BackorderDTO> {
    const backorder = await this.backorderService.getBackorderByOrderItemId(query.orderItemId);
    return Backorder.toDTO(backorder);
  }
}
