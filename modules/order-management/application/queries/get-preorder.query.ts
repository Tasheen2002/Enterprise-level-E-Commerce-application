import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder, PreorderDTO } from "../../domain/entities/preorder.entity";

export interface GetPreorderQuery extends IQuery {
  readonly orderItemId: string;
}

export class GetPreorderHandler implements IQueryHandler<GetPreorderQuery, QueryResult<PreorderDTO>> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(query: GetPreorderQuery): Promise<QueryResult<PreorderDTO>> {
    const preorder = await this.preorderService.getPreorderByOrderItemId(query.orderItemId);
    return QueryResult.success(Preorder.toDTO(preorder));
  }
}
