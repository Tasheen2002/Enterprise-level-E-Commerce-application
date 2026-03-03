import { ICommand } from "@/api/src/shared/application";

export interface CreateReservationCommand extends ICommand {
  cartId: string;
  variantId: string;
  quantity: number;
  durationMinutes?: number;
}
