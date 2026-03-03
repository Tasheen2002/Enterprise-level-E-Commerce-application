import { randomUUID } from "crypto";

export interface OrderShipmentProps {
  shipmentId: string;
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt: boolean;
  pickupLocationId?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export class OrderShipment {
  private shipmentId: string;
  private orderId: string;
  private carrier?: string;
  private service?: string;
  private trackingNumber?: string;
  private giftReceipt: boolean;
  private pickupLocationId?: string;
  private shippedAt?: Date;
  private deliveredAt?: Date;

  private constructor(props: OrderShipmentProps) {
    this.shipmentId = props.shipmentId;
    this.orderId = props.orderId;
    this.carrier = props.carrier;
    this.service = props.service;
    this.trackingNumber = props.trackingNumber;
    this.giftReceipt = props.giftReceipt;
    this.pickupLocationId = props.pickupLocationId;
    this.shippedAt = props.shippedAt;
    this.deliveredAt = props.deliveredAt;
  }

  static create(props: Omit<OrderShipmentProps, "shipmentId">): OrderShipment {
    if (props.deliveredAt && !props.shippedAt) {
      throw new Error("Cannot have deliveredAt without shippedAt");
    }

    if (
      props.deliveredAt &&
      props.shippedAt &&
      props.deliveredAt < props.shippedAt
    ) {
      throw new Error("Delivered date cannot be before shipped date");
    }

    return new OrderShipment({
      shipmentId: randomUUID(),
      orderId: props.orderId,
      carrier: props.carrier,
      service: props.service,
      trackingNumber: props.trackingNumber,
      giftReceipt: props.giftReceipt,
      pickupLocationId: props.pickupLocationId,
      shippedAt: props.shippedAt,
      deliveredAt: props.deliveredAt,
    });
  }

  static reconstitute(props: OrderShipmentProps): OrderShipment {
    return new OrderShipment(props);
  }

  getShipmentId(): string {
    return this.shipmentId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getCarrier(): string | undefined {
    return this.carrier;
  }

  getService(): string | undefined {
    return this.service;
  }

  getTrackingNumber(): string | undefined {
    return this.trackingNumber;
  }

  hasGiftReceipt(): boolean {
    return this.giftReceipt;
  }

  getPickupLocationId(): string | undefined {
    return this.pickupLocationId;
  }

  getShippedAt(): Date | undefined {
    return this.shippedAt;
  }

  getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  isShipped(): boolean {
    return !!this.shippedAt;
  }

  isDelivered(): boolean {
    return !!this.deliveredAt;
  }

  markAsShipped(
    carrier: string,
    service: string,
    trackingNumber: string,
  ): void {
    if (this.shippedAt) {
      throw new Error("Shipment already marked as shipped");
    }

    this.carrier = carrier;
    this.service = service;
    this.trackingNumber = trackingNumber;
    this.shippedAt = new Date();
  }

  markAsDelivered(): void {
    if (!this.shippedAt) {
      throw new Error("Cannot mark as delivered before shipped");
    }

    if (this.deliveredAt) {
      throw new Error("Shipment already marked as delivered");
    }

    this.deliveredAt = new Date();
  }

  updateTrackingNumber(trackingNumber: string): void {
    this.trackingNumber = trackingNumber;
  }

  updateCarrier(carrier: string): void {
    this.carrier = carrier;
  }

  updateService(service: string): void {
    this.service = service;
  }

  equals(other: OrderShipment): boolean {
    return this.shipmentId === other.shipmentId;
  }

  toSnapshot(): OrderShipmentProps {
    return {
      shipmentId: this.shipmentId,
      orderId: this.orderId,
      carrier: this.carrier,
      service: this.service,
      trackingNumber: this.trackingNumber,
      giftReceipt: this.giftReceipt,
      pickupLocationId: this.pickupLocationId,
      shippedAt: this.shippedAt,
      deliveredAt: this.deliveredAt,
    };
  }
}
