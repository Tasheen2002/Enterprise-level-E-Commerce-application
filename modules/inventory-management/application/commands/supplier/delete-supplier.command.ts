import { ICommand } from "@/api/src/shared/application";

export interface DeleteSupplierCommand extends ICommand {
  supplierId: string;
}
