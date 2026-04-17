import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderManagementService } from "../services/purchase-order-management.service";

export interface GetPurchaseOrderQuery extends IQuery {
  readonly poId: string;
}

export type PurchaseOrderResult = PurchaseOrderDTO;

export class GetPurchaseOrderHandler implements IQueryHandler<
  GetPurchaseOrderQuery,
  PurchaseOrderResult
> {
  constructor(private readonly poService: PurchaseOrderManagementService) {}

  async handle(query: GetPurchaseOrderQuery): Promise<PurchaseOrderResult> {
    return this.poService.getPurchaseOrder(query.poId);
  }
}
