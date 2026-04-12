import { IQuery, IQueryHandler, QueryResult } from "../../../../../packages/core/src/application/cqrs";
import { SupplierDTO } from "../../../domain/entities/supplier.entity";
import { SupplierManagementService } from "../../services/supplier-management.service";

export interface GetSupplierQuery extends IQuery {
  supplierId: string;
}

export type SupplierResult = SupplierDTO;

export class GetSupplierHandler implements IQueryHandler<
  GetSupplierQuery,
  QueryResult<SupplierResult>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(query: GetSupplierQuery): Promise<QueryResult<SupplierResult>> {
    const supplier = await this.supplierService.getSupplier(query.supplierId);
    return QueryResult.success(supplier);
  }
}
