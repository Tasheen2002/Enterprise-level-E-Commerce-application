import { ICommand } from "@/api/src/shared/application";

export interface MarkShipmentDeliveredCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  deliveredAt?: Date;
}
