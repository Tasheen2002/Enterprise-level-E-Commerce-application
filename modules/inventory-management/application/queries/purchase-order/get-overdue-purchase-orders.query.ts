import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderResult } from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface GetOverduePurchaseOrdersQuery extends IQuery {}

export class GetOverduePurchaseOrdersHandler implements IQueryHandler<
  GetOverduePurchaseOrdersQuery,
  QueryResult<PurchaseOrderResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(_query: GetOverduePurchaseOrdersQuery): Promise<QueryResult<PurchaseOrderResult[]>> {
    const purchaseOrders = await this.poService.getOverduePurchaseOrders();
    return QueryResult.success(purchaseOrders);
  }
}
