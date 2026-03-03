import { ICommand } from "@/api/src/shared/application";
import { SupplierContact } from "../../../domain/entities/supplier.entity";

export interface UpdateSupplierCommand extends ICommand {
  supplierId: string;
  name?: string;
  leadTimeDays?: number;
  contacts?: SupplierContact[];
}
