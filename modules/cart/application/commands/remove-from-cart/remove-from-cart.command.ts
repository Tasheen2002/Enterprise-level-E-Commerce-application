import { ICommand } from "@/api/src/shared/application";

export interface RemoveFromCartCommand extends ICommand {
  cartId: string;
  variantId: string;
  userId?: string;
  guestToken?: string;
}
