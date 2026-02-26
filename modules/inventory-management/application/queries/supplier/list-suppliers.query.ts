import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
import { SupplierManagementService } from "../../services/supplier-management.service";
import { SupplierResult } from "./get-supplier.query";

export interface ListSuppliersQuery extends IQuery {
  limit?: number;
  offset?: number;
}

export interface ListSuppliersResult {
  suppliers: SupplierResult[];
  total: number;
}

export class ListSuppliersQueryHandler implements IQueryHandler<
  ListSuppliersQuery,
  CommandResult<ListSuppliersResult>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(
    query: ListSuppliersQuery,
  ): Promise<CommandResult<ListSuppliersResult>> {
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

      return CommandResult.success({
        suppliers,
        total: result.total,
      });
    } catch (error) {
      return CommandResult.failure<ListSuppliersResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { ListSuppliersQueryHandler as ListSuppliersHandler };
