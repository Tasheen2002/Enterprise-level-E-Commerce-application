import { ICommand } from "@/api/src/shared/application";

export interface FulfillReservationCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
}
