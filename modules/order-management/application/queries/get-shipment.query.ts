import { IQuery } from "@/api/src/shared/application";

export interface GetShipmentQuery extends IQuery {
  orderId: string;
  shipmentId: string;
}

export interface ShipmentResult {
  shipmentId: string;
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt: boolean;
  pickupLocationId?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  isShipped: boolean;
  isDelivered: boolean;
}
