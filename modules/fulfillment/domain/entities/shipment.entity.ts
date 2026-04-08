import { ShipmentId, ShipmentStatus } from "../value-objects";
import { ShipmentItem } from "./shipment-item.entity";

export interface CreateShipmentData {
  orderId: string;
  carrier?: string;
  service?: string;
  labelUrl?: string;
  isGift?: boolean;
  giftMessage?: string;
  items?: CreateShipmentItemData[];
}

export interface CreateShipmentItemData {
  orderItemId: string;
  qty: number;
}

export class Shipment {
  private constructor(
    private readonly shipmentId: ShipmentId,
    private readonly orderId: string,
    private carrier: string | undefined,
    private service: string | undefined,
    private labelUrl: string | undefined,
    private status: ShipmentStatus,
    private items: ShipmentItem[],
    private isGift: boolean,
    private giftMessage: string | undefined,
    private shippedAt: Date | undefined,
    private deliveredAt: Date | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(data: CreateShipmentData): Shipment {
    const shipmentId = ShipmentId.create();
    const now = new Date();

    const items =
      data.items?.map((itemData) =>
        ShipmentItem.create({
          shipmentId: shipmentId.getValue(),
          orderItemId: itemData.orderItemId,
          qty: itemData.qty,
        })
      ) || [];

    return new Shipment(
      shipmentId,
      data.orderId,
      data.carrier,
      data.service,
      data.labelUrl,
      ShipmentStatus.created(),
      items,
      data.isGift || false,
      data.giftMessage,
      undefined,
      undefined,
      now,
      now
    );
  }

  static reconstitute(data: {
    shipmentId: ShipmentId;
    orderId: string;
    carrier?: string;
    service?: string;
    labelUrl?: string;
    status: ShipmentStatus;
    items: ShipmentItem[];
    isGift?: boolean;
    giftMessage?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Shipment {
    return new Shipment(
      data.shipmentId,
      data.orderId,
      data.carrier,
      data.service,
      data.labelUrl,
      data.status,
      data.items,
      data.isGift || false,
      data.giftMessage,
      data.shippedAt,
      data.deliveredAt,
      data.createdAt,
      data.updatedAt
    );
  }

  // Getters
  getShipmentId(): ShipmentId {
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

  getLabelUrl(): string | undefined {
    return this.labelUrl;
  }

  getStatus(): ShipmentStatus {
    return this.status;
  }

  getItems(): ShipmentItem[] {
    return [...this.items];
  }

  isGiftOrder(): boolean {
    return this.isGift;
  }

  getGiftMessage(): string | undefined {
    return this.giftMessage;
  }

  getShippedAt(): Date | undefined {
    return this.shippedAt;
  }

  getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business methods
  updateStatus(newStatus: ShipmentStatus): void {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this.status.toString()} to ${newStatus.toString()}`
      );
    }

    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus.isInTransit() && !this.shippedAt) {
      this.shippedAt = new Date();
    }

    if (newStatus.isDelivered() && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }

  updateCarrier(carrier: string): void {
    this.carrier = carrier;
    this.updatedAt = new Date();
  }

  updateService(service: string): void {
    this.service = service;
    this.updatedAt = new Date();
  }

  updateLabelUrl(labelUrl: string): void {
    this.labelUrl = labelUrl;
    this.updatedAt = new Date();
  }

  addItem(itemData: CreateShipmentItemData): void {
    const item = ShipmentItem.create({
      shipmentId: this.shipmentId.getValue(),
      orderItemId: itemData.orderItemId,
      qty: itemData.qty,
    });

    this.items.push(item);
    this.updatedAt = new Date();
  }

  removeItem(orderItemId: string): void {
    const index = this.items.findIndex(
      (item) => item.getOrderItemId() === orderItemId
    );

    if (index === -1) {
      throw new Error("Item not found in shipment");
    }

    this.items.splice(index, 1);
    this.updatedAt = new Date();
  }

  getTotalItems(): number {
    return this.items.reduce((total, item) => total + item.getQty(), 0);
  }

  hasItems(): boolean {
    return this.items.length > 0;
  }

  updateGift(isGift: boolean, giftMessage?: string): void {
    this.isGift = Boolean(isGift);
    this.giftMessage = giftMessage;
    this.updatedAt = new Date();
  }
}
