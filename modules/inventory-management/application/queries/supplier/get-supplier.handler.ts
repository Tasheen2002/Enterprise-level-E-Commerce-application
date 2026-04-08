import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetSupplierQuery, SupplierResult } from "./get-supplier.query";
import { SupplierManagementService } from "../../services/supplier-management.service";

export class GetSupplierHandler implements IQueryHandler<
  GetSupplierQuery,
  QueryResult<SupplierResult>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(query: GetSupplierQuery): Promise<QueryResult<SupplierResult>> {
    try {
      const supplier = await this.supplierService.getSupplier(query.supplierId);

      const result: SupplierResult = {
        supplierId: supplier.getSupplierId().getValue(),
        name: supplier.getName(),
        leadTimeDays: supplier.getLeadTimeDays(),
        contacts: supplier.getContacts(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
