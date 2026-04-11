import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PurchaseOrderDTO } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../../services/purchase-order-management.service";

export interface GetPurchaseOrderQuery extends IQuery {
  poId: string;
}

export type PurchaseOrderResult = PurchaseOrderDTO;

export class GetPurchaseOrderHandler implements IQueryHandler<
  GetPurchaseOrderQuery,
  QueryResult<PurchaseOrderResult>
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPurchaseOrderQuery): Promise<QueryResult<PurchaseOrderResult>> {
    const purchaseOrder = await this.poService.getPurchaseOrder(query.poId);
    return QueryResult.success(purchaseOrder);
  }
}
