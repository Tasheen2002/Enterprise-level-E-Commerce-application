import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderItemDTO } from "../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface GetPOItemsQuery extends IQuery {
  readonly poId: string;
}

export type POItemResult = PurchaseOrderItemDTO;

export class GetPOItemsHandler implements IQueryHandler<
  GetPOItemsQuery,
  POItemResult[]
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPOItemsQuery): Promise<POItemResult[]> {
    return this.poService.getPurchaseOrderItems(query.poId);
  }
}
