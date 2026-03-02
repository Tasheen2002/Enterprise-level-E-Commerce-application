import {
  OrderId,
  OrderNumber,
  OrderStatus,
  OrderSource,
  Currency,
  OrderTotals,
} from "../value-objects";
import { OrderItem } from "./order-item.entity";
import { OrderAddress } from "./order-address.entity";
import { OrderShipment } from "./order-shipment.entity";

export class Order {
  private constructor(
    private readonly orderId: OrderId,
    private readonly orderNumber: OrderNumber,
    private userId: string | undefined,
    private guestToken: string | undefined,
    private items: OrderItem[],
    private address: OrderAddress | undefined,
    private shipments: OrderShipment[],
    private totals: OrderTotals,
    private status: OrderStatus,
    private readonly source: OrderSource,
    private readonly currency: Currency,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(data: CreateOrderData): Order {
    if (!data.userId && !data.guestToken) {
      throw new Error("Order must have either userId or guestToken");
    }

    if (data.userId && data.guestToken) {
      throw new Error("Order cannot have both userId and guestToken");
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    const orderId = OrderId.create();
    const orderNumber = OrderNumber.generate();
    const now = new Date();

    // Create order items
    const items = data.items.map((item) =>
      OrderItem.create({
        orderId: orderId.getValue(),
        variantId: item.variantId,
        quantity: item.quantity,
        productSnapshot: item.productSnapshot,
        isGift: item.isGift || false,
        giftMessage: item.giftMessage,
      }),
    );

    // Calculate subtotal from items
    const subtotal = items.reduce(
      (sum, item) => sum + item.calculateSubtotal(),
      0,
    );

    // Create totals
    const totals = OrderTotals.create({
      subtotal,
      tax: data.tax || 0,
      shipping: data.shipping || 0,
      discount: data.discount || 0,
      total:
        subtotal +
        (data.tax || 0) +
        (data.shipping || 0) -
        (data.discount || 0),
    });

    return new Order(
      orderId,
      orderNumber,
      data.userId,
      data.guestToken,
      items,
      undefined,
      [],
      totals,
      OrderStatus.created(),
      data.source || OrderSource.fromString("web"),
      data.currency,
      now,
      now,
    );
  }

  static reconstitute(data: OrderData): Order {
    return new Order(
      OrderId.fromString(data.orderId),
      OrderNumber.create(data.orderNumber),
      data.userId,
      data.guestToken,
      data.items || [],
      data.address,
      data.shipments || [],
      data.totals,
      data.status,
      data.source,
      data.currency,
      data.createdAt,
      data.updatedAt,
    );
  }

  static fromDatabaseRow(
    row: OrderDatabaseRow,
    items: OrderItem[] = [],
    address?: OrderAddress,
    shipments: OrderShipment[] = [],
  ): Order {
    return new Order(
      OrderId.fromString(row.order_id),
      OrderNumber.create(row.order_no),
      row.user_id || undefined,
      row.guest_token || undefined,
      items,
      address,
      shipments,
      OrderTotals.create(row.totals),
      OrderStatus.fromString(row.status),
      OrderSource.fromString(row.source),
      Currency.create(row.currency),
      row.created_at,
      row.updated_at,
    );
  }

  // Getters
  getOrderId(): OrderId {
    return this.orderId;
  }

  getOrderNumber(): OrderNumber {
    return this.orderNumber;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getGuestToken(): string | undefined {
    return this.guestToken;
  }

  getItems(): OrderItem[] {
    return [...this.items];
  }

  getAddress(): OrderAddress | undefined {
    return this.address;
  }

  getShipments(): OrderShipment[] {
    return [...this.shipments];
  }

  getTotals(): OrderTotals {
    return this.totals;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getSource(): OrderSource {
    return this.source;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Aggregate root methods - Item management
  addItem(item: OrderItem): void {
    if (this.status.getValue() !== "created") {
      throw new Error(
        "Cannot add items to order that is not in created status",
      );
    }

    this.items.push(item);
    this.recalculateTotals();
    this.touch();
  }

  removeItem(itemId: string): void {
    if (this.status.getValue() !== "created") {
      throw new Error(
        "Cannot remove items from order that is not in created status",
      );
    }

    const index = this.items.findIndex(
      (item) => item.getOrderItemId() === itemId,
    );
    if (index === -1) {
      throw new Error("Item not found in order");
    }

    this.items.splice(index, 1);

    if (this.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    this.recalculateTotals();
    this.touch();
  }

  updateItemQuantity(itemId: string, quantity: number): void {
    if (this.status.getValue() !== "created") {
      throw new Error(
        "Cannot update item quantity for order that is not in created status",
      );
    }

    const item = this.items.find((item) => item.getOrderItemId() === itemId);
    if (!item) {
      throw new Error("Item not found in order");
    }

    item.updateQuantity(quantity);
    this.recalculateTotals();
    this.touch();
  }

  // Aggregate root methods - Address management
  setAddress(address: OrderAddress): void {
    if (this.status.getValue() !== "created") {
      throw new Error(
        "Cannot set address for order that is not in created status",
      );
    }

    this.address = address;
    this.touch();
  }

  // Aggregate root methods - Shipment management
  createShipment(shipment: OrderShipment): void {
    if (!this.status.isFulfilled() && this.status.getValue() !== "paid") {
      throw new Error(
        "Cannot create shipment for order that is not paid or fulfilled",
      );
    }

    this.shipments.push(shipment);
    this.touch();
  }

  // Business logic methods - Status management
  markAsPaid(): void {
    if (!this.address) {
      throw new Error("Cannot mark order as paid without address");
    }

    this.changeStatus(OrderStatus.paid());
  }

  markAsFulfilled(): void {
    if (this.shipments.length === 0) {
      throw new Error("Cannot mark order as fulfilled without shipments");
    }

    this.changeStatus(OrderStatus.fulfilled());
  }

  cancel(): void {
    if (this.status.isFulfilled()) {
      throw new Error("Cannot cancel fulfilled order");
    }

    this.changeStatus(OrderStatus.cancelled());
  }

  refund(): void {
    if (!this.status.isFulfilled() && !this.status.isPaid()) {
      throw new Error("Can only refund paid or fulfilled orders");
    }

    this.changeStatus(OrderStatus.refunded());
  }

  updateStatus(newStatus: OrderStatus): void {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this.status.getValue()} to ${newStatus.getValue()}`,
      );
    }

    this.status = newStatus;
    this.touch();
  }

  private changeStatus(newStatus: OrderStatus): void {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this.status.getValue()} to ${newStatus.getValue()}`,
      );
    }

    this.status = newStatus;
    this.touch();
  }

  // Business logic methods - Totals management
  updateTotals(tax: number, shipping: number, discount: number): void {
    const subtotal = this.calculateSubtotal();

    this.totals = OrderTotals.create({
      subtotal,
      tax,
      shipping,
      discount,
      total: subtotal + tax + shipping - discount,
    });

    this.touch();
  }

  private recalculateTotals(): void {
    const subtotal = this.calculateSubtotal();
    const currentTotals = this.totals.toJSON();

    this.totals = OrderTotals.create({
      subtotal,
      tax: currentTotals.tax,
      shipping: currentTotals.shipping,
      discount: currentTotals.discount,
      total:
        subtotal +
        currentTotals.tax +
        currentTotals.shipping -
        currentTotals.discount,
    });
  }

  private calculateSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.calculateSubtotal(), 0);
  }

  // Validation methods
  isGuestOrder(): boolean {
    return !!this.guestToken;
  }

  isUserOrder(): boolean {
    return !!this.userId;
  }

  hasAddress(): boolean {
    return !!this.address;
  }

  hasShipments(): boolean {
    return this.shipments.length > 0;
  }

  canBePaid(): boolean {
    return (
      this.status.isCreated() && this.hasAddress() && this.items.length > 0
    );
  }

  canBeFulfilled(): boolean {
    return this.status.isPaid() && this.hasShipments();
  }

  canBeCancelled(): boolean {
    return (
      !this.status.isFulfilled() &&
      !this.status.isCancelled() &&
      !this.status.isRefunded()
    );
  }

  canBeRefunded(): boolean {
    return this.status.isPaid() || this.status.isFulfilled();
  }

  getTotalItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.getQuantity(), 0);
  }

  // Internal methods
  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to data for persistence
  toData(): OrderData {
    return {
      orderId: this.orderId.getValue(),
      orderNumber: this.orderNumber.getValue(),
      userId: this.userId,
      guestToken: this.guestToken,
      items: this.items,
      address: this.address,
      shipments: this.shipments,
      totals: this.totals,
      status: this.status,
      source: this.source,
      currency: this.currency,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDatabaseRow(): OrderDatabaseRow {
    return {
      order_id: this.orderId.getValue(),
      order_no: this.orderNumber.getValue(),
      user_id: this.userId || null,
      guest_token: this.guestToken || null,
      totals: this.totals.toJSON(),
      status: this.status.getValue(),
      source: this.source.getValue(),
      currency: this.currency.getValue(),
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  equals(other: Order): boolean {
    return this.orderId.equals(other.orderId);
  }
}

// Supporting types and interfaces
export interface CreateOrderItemData {
  variantId: string;
  quantity: number;
  productSnapshot: any;
  isGift?: boolean;
  giftMessage?: string;
}

export interface CreateOrderData {
  userId?: string;
  guestToken?: string;
  items: CreateOrderItemData[];
  source?: OrderSource;
  currency: Currency;
  tax?: number;
  shipping?: number;
  discount?: number;
}

export interface OrderData {
  orderId: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: OrderItem[];
  address?: OrderAddress;
  shipments: OrderShipment[];
  totals: OrderTotals;
  status: OrderStatus;
  source: OrderSource;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDatabaseRow {
  order_id: string;
  order_no: string;
  user_id: string | null;
  guest_token: string | null;
  totals: any;
  status: string;
  source: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}
