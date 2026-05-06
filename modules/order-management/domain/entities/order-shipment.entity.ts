import { ShipmentId } from "../value-objects/shipment-id.vo";
import {
  DomainValidationError,
  ShipmentAlreadyShippedError,
  ShipmentAlreadyDeliveredError,
  InvalidOperationError,
} from "../errors/order-management.errors";

export interface OrderShipmentProps {
  shipmentId: ShipmentId;
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt: boolean;
  pickupLocationId?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
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
  isShipped: boolean;
  isDelivered: boolean;
}

export class OrderShipment {
  private constructor(private props: OrderShipmentProps) {
    OrderShipment.validate(props);
  }

  static create(
    params: Omit<OrderShipmentProps, "shipmentId">,
  ): OrderShipment {
    return new OrderShipment({
      ...params,
      shipmentId: ShipmentId.create(),
    });
  }

  static fromPersistence(props: OrderShipmentProps): OrderShipment {
    return new OrderShipment(props);
  }

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: OrderShipmentProps): void {
    if (props.deliveredAt && !props.shippedAt) {
      throw new DomainValidationError(
        "Cannot have deliveredAt without shippedAt",
      );
    }
    if (
      props.deliveredAt &&
      props.shippedAt &&
      props.deliveredAt < props.shippedAt
    ) {
      throw new DomainValidationError(
        "Delivered date cannot be before shipped date",
      );
    }
  }

  get shipmentId(): ShipmentId {
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
      throw new ShipmentAlreadyShippedError(this.props.shipmentId.getValue());
    }
    if (!carrier || carrier.trim().length === 0) {
      throw new DomainValidationError("Carrier is required to mark shipped");
    }
    if (!service || service.trim().length === 0) {
      throw new DomainValidationError("Service is required to mark shipped");
    }
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new DomainValidationError("Tracking number is required to mark shipped");
    }

    this.props.carrier = carrier;
    this.props.service = service;
    this.props.trackingNumber = trackingNumber;
    this.props.shippedAt = new Date();
  }


  markAsDelivered(deliveredAt?: Date): void {
    if (!this.props.shippedAt) {
      throw new InvalidOperationError(
        "Cannot mark as delivered before shipped",
      );
    }

    if (this.props.deliveredAt) {
      throw new ShipmentAlreadyDeliveredError(this.props.shipmentId.getValue());
    }

    const when = deliveredAt ?? new Date();

    if (when < this.props.shippedAt) {
      throw new DomainValidationError(
        "Delivered date cannot be before shipped date",
      );
    }
    if (when > new Date()) {
      throw new DomainValidationError(
        "Delivered date cannot be in the future",
      );
    }

    this.props.deliveredAt = when;
  }

  updateTrackingNumber(trackingNumber: string): void {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new DomainValidationError("Tracking number cannot be empty");
    }
    this.props.trackingNumber = trackingNumber;
  }

  updateCarrier(carrier: string): void {
    if (!carrier || carrier.trim().length === 0) {
      throw new DomainValidationError("Carrier cannot be empty");
    }
    this.props.carrier = carrier;
  }

  updateService(service: string): void {
    if (!service || service.trim().length === 0) {
      throw new DomainValidationError("Service cannot be empty");
    }
    this.props.service = service;
  }

  equals(other: OrderShipment): boolean {
    return this.props.shipmentId.equals(other.props.shipmentId);
  }

  static toDTO(entity: OrderShipment): OrderShipmentDTO {
    return {
      shipmentId: entity.props.shipmentId.getValue(),
      orderId: entity.props.orderId,
      carrier: entity.props.carrier,
      service: entity.props.service,
      trackingNumber: entity.props.trackingNumber,
      giftReceipt: entity.props.giftReceipt,
      pickupLocationId: entity.props.pickupLocationId,
      shippedAt: entity.props.shippedAt?.toISOString(),
      deliveredAt: entity.props.deliveredAt?.toISOString(),
      isShipped: entity.isShipped(),
      isDelivered: entity.isDelivered(),
    };
  }
}
