import { ICommand } from "@/api/src/shared/application";

export interface AddPOItemCommand extends ICommand {
  poId: string;
  variantId: string;
  orderedQty: number;
}
