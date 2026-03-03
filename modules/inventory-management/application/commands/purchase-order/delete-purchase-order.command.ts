import { ICommand } from "@/api/src/shared/application";

export interface DeletePurchaseOrderCommand extends ICommand {
  poId: string;
}
