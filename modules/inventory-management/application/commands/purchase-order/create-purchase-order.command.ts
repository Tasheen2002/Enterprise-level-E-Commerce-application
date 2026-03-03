import { ICommand } from "@/api/src/shared/application";

export interface CreatePurchaseOrderCommand extends ICommand {
  supplierId: string;
  eta?: Date;
}
