import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { PreorderDTO } from "../../domain/entities/preorder.entity";
import { PreorderNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetPreorderQuery extends IQuery {
  readonly orderItemId: string;
}

export class GetPreorderHandler implements IQueryHandler<GetPreorderQuery, PreorderDTO> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(query: GetPreorderQuery): Promise<PreorderDTO> {
    const preorder = await this.preorderService.getPreorderByOrderItemId(query.orderItemId);
    if (!preorder) throw new PreorderNotFoundError(query.orderItemId);
    return preorder;
  }
}
