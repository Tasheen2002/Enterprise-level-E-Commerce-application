import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderResult } from "./get-purchase-order.query";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface GetPendingReceivalQuery extends IQuery {}

export class GetPendingReceivalHandler implements IQueryHandler<
  GetPendingReceivalQuery,
  PurchaseOrderResult[]
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(_query: GetPendingReceivalQuery): Promise<PurchaseOrderResult[]> {
    return this.poService.getPendingReceival();
  }
}
