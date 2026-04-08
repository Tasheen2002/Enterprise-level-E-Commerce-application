import { ICommand } from "@/api/src/shared/application";

export interface CreateShipmentCommand extends ICommand {
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt?: boolean;
  pickupLocationId?: string;
}
