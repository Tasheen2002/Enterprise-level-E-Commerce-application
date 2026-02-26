import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { SupplierManagementService } from "../../services/supplier-management.service";
import { SupplierContact } from "../../../domain/entities/supplier.entity";

export interface GetSupplierQuery extends IQuery {
  supplierId: string;
}

export interface SupplierResult {
  supplierId: string;
  name: string;
  leadTimeDays?: number;
  contacts: SupplierContact[];
}

export class GetSupplierHandler implements IQueryHandler<
  GetSupplierQuery,
  QueryResult<SupplierResult | null>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(
    query: GetSupplierQuery,
  ): Promise<QueryResult<SupplierResult | null>> {
    try {
      if (!query.supplierId || query.supplierId.trim().length === 0) {
        return QueryResult.failure("supplierId: Supplier ID is required");
      }

      const supplier = await this.supplierService.getSupplier(query.supplierId);

      if (!supplier) {
        return QueryResult.success<SupplierResult | null>(null);
      }

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
