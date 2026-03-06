import { ICommand } from "@/api/src/shared/application";

export interface MarkShipmentShippedCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
}
