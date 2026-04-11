import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderResult } from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface GetPendingReceivalQuery extends IQuery {}

export class GetPendingReceivalHandler implements IQueryHandler<
  GetPendingReceivalQuery,
  QueryResult<PurchaseOrderResult[]>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(_query: GetPendingReceivalQuery): Promise<QueryResult<PurchaseOrderResult[]>> {
    const purchaseOrders = await this.poService.getPendingReceival();
    return QueryResult.success(purchaseOrders);
  }
}
