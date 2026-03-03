import { ICommand } from "@/api/src/shared/application";

export interface UpdatePOItemCommand extends ICommand {
  poId: string;
  variantId: string;
  orderedQty: number;
}
