import { IQuery } from "@/api/src/shared/application";
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
