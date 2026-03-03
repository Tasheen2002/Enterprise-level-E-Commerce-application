import { IQuery } from "@/api/src/shared/application";
import { SupplierResult } from "./get-supplier.query";

export interface ListSuppliersQuery extends IQuery {
  limit?: number;
  offset?: number;
}

export interface ListSuppliersResult {
  suppliers: SupplierResult[];
  total: number;
}
