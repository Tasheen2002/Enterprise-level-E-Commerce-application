import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  ListSuppliersQuery,
  ListSuppliersResult,
} from "./list-suppliers.query";
import { SupplierResult } from "./get-supplier.query";
import { SupplierManagementService } from "../../services/supplier-management.service";

export class ListSuppliersHandler implements IQueryHandler<
  ListSuppliersQuery,
  QueryResult<ListSuppliersResult>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(
    query: ListSuppliersQuery,
  ): Promise<QueryResult<ListSuppliersResult>> {
    try {
      const result = await this.supplierService.listSuppliers({
        limit: query.limit,
        offset: query.offset,
      });

      const suppliers: SupplierResult[] = result.suppliers.map((supplier) => ({
        supplierId: supplier.getSupplierId().getValue(),
        name: supplier.getName(),
        leadTimeDays: supplier.getLeadTimeDays(),
        contacts: supplier.getContacts(),
      }));

      return QueryResult.success({
        suppliers,
        total: result.total,
      });
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
