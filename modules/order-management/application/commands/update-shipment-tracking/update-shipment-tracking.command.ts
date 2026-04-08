import { ICommand } from "@/api/src/shared/application";

export interface UpdateShipmentTrackingCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  trackingNumber: string;
  carrier?: string;
  service?: string;
}
