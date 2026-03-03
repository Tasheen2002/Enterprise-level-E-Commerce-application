import { ICommand } from "@/api/src/shared/application";
import { SupplierContact } from "../../../domain/entities/supplier.entity";

export interface CreateSupplierCommand extends ICommand {
  name: string;
  leadTimeDays?: number;
  contacts?: SupplierContact[];
}
