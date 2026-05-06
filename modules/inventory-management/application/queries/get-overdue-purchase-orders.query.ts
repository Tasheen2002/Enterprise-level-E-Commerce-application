import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderResult } from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface GetOverduePurchaseOrdersQuery extends IQuery {}

export class GetOverduePurchaseOrdersHandler implements IQueryHandler<
  GetOverduePurchaseOrdersQuery,
  PurchaseOrderResult[]
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(_query: GetOverduePurchaseOrdersQuery): Promise<PurchaseOrderResult[]> {
    return this.poService.getOverduePurchaseOrders();
  }
}
