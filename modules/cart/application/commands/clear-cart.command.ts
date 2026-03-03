import { ICommand } from "@/api/src/shared/application";

export interface ClearCartCommand extends ICommand {
  cartId: string;
  userId?: string;
  guestToken?: string;
}
