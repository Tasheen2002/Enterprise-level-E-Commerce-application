import { ICommand } from "@/api/src/shared/application";

export interface CreatePickupReservationCommand extends ICommand {
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expirationMinutes?: number;
}
