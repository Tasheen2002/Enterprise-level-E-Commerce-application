import { ICommand } from "@/api/src/shared/application";

export interface UpdateCartItemCommand extends ICommand {
  cartId: string;
  variantId: string;
  quantity: number;
  userId?: string;
  guestToken?: string;
}
