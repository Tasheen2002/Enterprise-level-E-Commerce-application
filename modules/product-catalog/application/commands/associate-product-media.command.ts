import { ICommand } from "@/api/src/shared/application";

export interface AssociateProductMediaCommand extends ICommand {
  productId: string;
  assetId: string;
  position?: number;
  isCover?: boolean;
}
