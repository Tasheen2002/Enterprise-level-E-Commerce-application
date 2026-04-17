import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SupplierResult } from "./get-supplier.query";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface ListSuppliersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListSuppliersResult {
  readonly suppliers: SupplierResult[];
  readonly total: number;
}

export class ListSuppliersHandler implements IQueryHandler<
  ListSuppliersQuery,
  ListSuppliersResult
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(query: ListSuppliersQuery): Promise<ListSuppliersResult> {
    const result = await this.supplierService.listSuppliers({
      limit: query.limit,
      offset: query.offset,
    });
    return { suppliers: result.suppliers, total: result.total };
  }
}
