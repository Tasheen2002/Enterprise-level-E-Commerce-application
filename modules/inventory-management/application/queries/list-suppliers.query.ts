import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { SupplierResult } from "./get-supplier.query";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface ListSuppliersQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
}

export class ListSuppliersHandler implements IQueryHandler<
  ListSuppliersQuery,
  PaginatedResult<SupplierResult>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(query: ListSuppliersQuery): Promise<PaginatedResult<SupplierResult>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.supplierService.listSuppliers({ limit, offset });
    return {
      items: result.suppliers,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.suppliers.length < result.total,
    };
  }
}
