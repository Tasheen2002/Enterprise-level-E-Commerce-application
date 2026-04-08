export interface CreateShipmentItemData {
  shipmentId: string;
  orderItemId: string;
  qty: number;
  giftWrap?: boolean;
  giftMessage?: string;
}

export class ShipmentItem {
  private constructor(
    private readonly shipmentId: string,
    private readonly orderItemId: string,
    private qty: number,
    private giftWrap: boolean,
    private giftMessage: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(data: CreateShipmentItemData): ShipmentItem {
    if (data.qty <= 0) {
      throw new Error("Shipment item quantity must be greater than 0");
    }

    const now = new Date();

    return new ShipmentItem(
      data.shipmentId,
      data.orderItemId,
      data.qty,
      data.giftWrap || false,
      data.giftMessage,
      now,
      now
    );
  }

  static reconstitute(data: {
    shipmentId: string;
    orderItemId: string;
    qty: number;
    giftWrap: boolean;
    giftMessage?: string;
    createdAt: Date;
    updatedAt: Date;
  }): ShipmentItem {
    return new ShipmentItem(
      data.shipmentId,
      data.orderItemId,
      data.qty,
      data.giftWrap,
      data.giftMessage,
      data.createdAt,
      data.updatedAt
    );
  }

  // Getters
  getShipmentId(): string {
    return this.shipmentId;
  }

  getOrderItemId(): string {
    return this.orderItemId;
  }

  getQty(): number {
    return this.qty;
  }

  isGiftWrapped(): boolean {
    return this.giftWrap;
  }

  getGiftMessage(): string | undefined {
    return this.giftMessage;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business methods
  updateQty(newQty: number): void {
    if (newQty <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    this.qty = newQty;
    this.updatedAt = new Date();
  }

  setGiftWrap(giftWrap: boolean): void {
    this.giftWrap = giftWrap;
    this.updatedAt = new Date();
  }

  setGiftMessage(message: string | undefined): void {
    this.giftMessage = message;
    this.updatedAt = new Date();
  }

  equals(other: ShipmentItem): boolean {
    return (
      this.shipmentId === other.shipmentId &&
      this.orderItemId === other.orderItemId
    );
  }
}
