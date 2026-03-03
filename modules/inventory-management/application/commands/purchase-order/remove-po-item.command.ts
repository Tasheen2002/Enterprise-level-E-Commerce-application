import { ICommand } from "@/api/src/shared/application";

export interface RemovePOItemCommand extends ICommand {
  poId: string;
  variantId: string;
}
