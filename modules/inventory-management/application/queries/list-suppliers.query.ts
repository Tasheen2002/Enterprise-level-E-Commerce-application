import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { SupplierResult } from "./get-supplier.query";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface ListSuppliersQuery extends IQuery {
  limit?: number;
  offset?: number;
}

export interface ListSuppliersResult {
  suppliers: SupplierResult[];
  total: number;
}

export class ListSuppliersHandler implements IQueryHandler<
  ListSuppliersQuery,
  QueryResult<ListSuppliersResult>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(query: ListSuppliersQuery): Promise<QueryResult<ListSuppliersResult>> {
    const result = await this.supplierService.listSuppliers({
      limit: query.limit,
      offset: query.offset,
    });
    return QueryResult.success({ suppliers: result.suppliers, total: result.total });
  }
}
