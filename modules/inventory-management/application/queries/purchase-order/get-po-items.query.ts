import { IQuery, IQueryHandler, QueryResult } from "../../../../../packages/core/src/application/cqrs";
import { PurchaseOrderItemDTO } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface GetPOItemsQuery extends IQuery {
  poId: string;
}

export type POItemResult = PurchaseOrderItemDTO;

export class GetPOItemsHandler implements IQueryHandler<
  GetPOItemsQuery,
  QueryResult<POItemResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPOItemsQuery): Promise<QueryResult<POItemResult[]>> {
    const items = await this.poService.getPurchaseOrderItems(query.poId);
    return QueryResult.success(items);
  }
}
