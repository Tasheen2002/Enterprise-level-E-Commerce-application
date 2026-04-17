import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SupplierDTO } from "../../domain/entities/supplier.entity";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface GetSupplierQuery extends IQuery {
  readonly supplierId: string;
}

export type SupplierResult = SupplierDTO;

export class GetSupplierHandler implements IQueryHandler<
  GetSupplierQuery,
  SupplierResult
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(query: GetSupplierQuery): Promise<SupplierResult> {
    return this.supplierService.getSupplier(query.supplierId);
  }
}
