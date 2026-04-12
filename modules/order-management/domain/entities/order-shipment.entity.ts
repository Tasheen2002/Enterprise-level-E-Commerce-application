import { randomUUID } from "crypto";
import {
  DomainValidationError,
  ShipmentAlreadyShippedError,
  ShipmentAlreadyDeliveredError,
  InvalidOperationError,
} from "../errors/order-management.errors";


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
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderShipmentDTO {
  shipmentId: string;
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt: boolean;
  pickupLocationId?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class OrderShipment {
  private constructor(private props: OrderShipmentProps) {}

  static create(
    params: Omit<OrderShipmentProps, "shipmentId" | "createdAt" | "updatedAt">,
  ): OrderShipment {
    if (params.deliveredAt && !params.shippedAt) {
      throw new DomainValidationError(
        "Cannot have deliveredAt without shippedAt",
      );
    }

    if (
      params.deliveredAt &&
      params.shippedAt &&
      params.deliveredAt < params.shippedAt
    ) {
      throw new DomainValidationError(
        "Delivered date cannot be before shipped date",
      );
    }

    return new OrderShipment({
      ...params,
      shipmentId: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderShipmentProps): OrderShipment {
    return new OrderShipment(props);
  }

  get shipmentId(): string {
    return this.props.shipmentId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get carrier(): string | undefined {
    return this.props.carrier;
  }

  get service(): string | undefined {
    return this.props.service;
  }

  get trackingNumber(): string | undefined {
    return this.props.trackingNumber;
  }

  get giftReceipt(): boolean {
    return this.props.giftReceipt;
  }

  get pickupLocationId(): string | undefined {
    return this.props.pickupLocationId;
  }

  get shippedAt(): Date | undefined {
    return this.props.shippedAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasGiftReceipt(): boolean {
    return this.props.giftReceipt;
  }

  isShipped(): boolean {
    return !!this.props.shippedAt;
  }

  isDelivered(): boolean {
    return !!this.props.deliveredAt;
  }

  markAsShipped(
    carrier: string,
    service: string,
    trackingNumber: string,
  ): void {
    if (this.props.shippedAt) {
      throw new ShipmentAlreadyShippedError(this.props.shipmentId);
    }

    this.props.carrier = carrier;
    this.props.service = service;
    this.props.trackingNumber = trackingNumber;
    this.props.shippedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsDelivered(): void {
    if (!this.props.shippedAt) {
      throw new InvalidOperationError(
        "Cannot mark as delivered before shipped",
      );
    }

    if (this.props.deliveredAt) {
      throw new ShipmentAlreadyDeliveredError(this.props.shipmentId);
    }

    this.props.deliveredAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateTrackingNumber(trackingNumber: string): void {
    this.props.trackingNumber = trackingNumber;
    this.props.updatedAt = new Date();
  }

  updateCarrier(carrier: string): void {
    this.props.carrier = carrier;
    this.props.updatedAt = new Date();
  }

  updateService(service: string): void {
    this.props.service = service;
    this.props.updatedAt = new Date();
  }

  equals(other: OrderShipment): boolean {
    return this.props.shipmentId === other.props.shipmentId;
  }

  static toDTO(entity: OrderShipment): OrderShipmentDTO {
    return {
      shipmentId: entity.props.shipmentId,
      orderId: entity.props.orderId,
      carrier: entity.props.carrier,
      service: entity.props.service,
      trackingNumber: entity.props.trackingNumber,
      giftReceipt: entity.props.giftReceipt,
      pickupLocationId: entity.props.pickupLocationId,
      shippedAt: entity.props.shippedAt?.toISOString(),
      deliveredAt: entity.props.deliveredAt?.toISOString(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
