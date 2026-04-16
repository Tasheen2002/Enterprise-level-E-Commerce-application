import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  OrderId,
  OrderNumber,
  OrderStatus,
  OrderSource,
  Currency,
  OrderTotals,
  OrderTotalsData,
} from "../value-objects";
import {
  OrderItem,
  OrderItemDTO,
} from "./order-item.entity";
import { OrderAddress, OrderAddressDTO } from "./order-address.entity";
import { OrderShipment, OrderShipmentDTO } from "./order-shipment.entity";
import {
  DomainValidationError,
  OrderNotEditableError,
  OrderItemNotFoundError,
  OrderAddressRequiredError,
  InvalidOperationError,
  OrderCancellationError,
  OrderRefundError,
  InvalidOrderStatusTransitionError,
} from "../errors/order-management.errors";

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly total: number,
  ) {
    super(orderId, "Order");
  }
  get eventType(): string {
    return "order.created";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      orderNumber: this.orderNumber,
      total: this.total,
    };
  }
}

export class OrderStatusUpdatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
  ) {
    super(orderId, "Order");
  }
  get eventType(): string {
    return "order.status.updated";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
    };
  }
}

export class OrderItemAddedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly variantId: string,
  ) {
    super(orderId, "Order");
  }
  get eventType(): string { return "order.item.added"; }
  getPayload(): Record<string, unknown> {
    return { orderId: this.orderId, variantId: this.variantId };
  }
}

export class OrderItemRemovedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly itemId: string,
  ) {
    super(orderId, "Order");
  }
  get eventType(): string { return "order.item.removed"; }
  getPayload(): Record<string, unknown> {
    return { orderId: this.orderId, itemId: this.itemId };
  }
}

export class OrderShipmentCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly shipmentId: string,
  ) {
    super(orderId, "Order");
  }
  get eventType(): string { return "order.shipment.created"; }
  getPayload(): Record<string, unknown> {
    return { orderId: this.orderId, shipmentId: this.shipmentId };
  }
}

export interface OrderProps {
  id: OrderId;
  orderNumber: OrderNumber;
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

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: OrderItemDTO[];
  address?: OrderAddressDTO;
  shipments: OrderShipmentDTO[];
  totals: OrderTotalsData;
  status: string;
  source: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export class Order extends AggregateRoot {
  private constructor(private props: OrderProps) {
    super();
  }

  static create(
    params: Omit<
      OrderProps,
      "id" | "orderNumber" | "status" | "createdAt" | "updatedAt"
    >,
  ): Order {
    Order.validateIdentity(params.userId, params.guestToken);

    if (!params.items || params.items.length === 0) {
      throw new DomainValidationError("Order must have at least one item");
    }

    const orderId = OrderId.create();
    const orderNumber = OrderNumber.generate();

    const order = new Order({
      ...params,
      id: orderId,
      orderNumber,
      status: OrderStatus.created(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    order.addDomainEvent(
      new OrderCreatedEvent(
        order.props.id.getValue(),
        order.props.orderNumber.getValue(),
        order.props.totals.total,
      ),
    );

    return order;
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  private static validateIdentity(userId?: string, guestToken?: string): void {
    if (!userId && !guestToken) {
      throw new DomainValidationError(
        "Order must have either userId or guestToken",
      );
    }

    if (userId && guestToken) {
      throw new DomainValidationError(
        "Order cannot have both userId and guestToken",
      );
    }
  }

  // Getters
  get id(): OrderId {
    return this.props.id;
  }
  get orderNumber(): OrderNumber {
    return this.props.orderNumber;
  }
  get userId(): string | undefined {
    return this.props.userId;
  }
  get guestToken(): string | undefined {
    return this.props.guestToken;
  }
  get items(): OrderItem[] {
    return [...this.props.items];
  }
  get address(): OrderAddress | undefined {
    return this.props.address;
  }
  get shipments(): OrderShipment[] {
    return [...this.props.shipments];
  }
  get totals(): OrderTotals {
    return this.props.totals;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get source(): OrderSource {
    return this.props.source;
  }
  get currency(): Currency {
    return this.props.currency;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Aggregate Root Logic

  addItem(item: OrderItem): void {
    if (!this.props.status.isCreated()) {
      throw new OrderNotEditableError(this.props.status.getValue());
    }

    this.props.items.push(item);
    this.recalculateTotals();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new OrderItemAddedEvent(this.props.id.getValue(), item.variantId),
    );
  }

  removeItem(itemId: string): void {
    if (!this.props.status.isCreated()) {
      throw new OrderNotEditableError(this.props.status.getValue());
    }

    const index = this.props.items.findIndex(
      (item) => item.orderItemId === itemId,
    );
    if (index === -1) {
      throw new OrderItemNotFoundError(itemId);
    }

    this.props.items.splice(index, 1);

    if (this.props.items.length === 0) {
      throw new DomainValidationError("Order must have at least one item");
    }

    this.recalculateTotals();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new OrderItemRemovedEvent(this.props.id.getValue(), itemId),
    );
  }

  updateItemQuantity(itemId: string, quantity: number): void {
    if (!this.props.status.isCreated()) {
      throw new OrderNotEditableError(this.props.status.getValue());
    }

    const item = this.props.items.find((item) => item.orderItemId === itemId);
    if (!item) {
      throw new OrderItemNotFoundError(itemId);
    }

    item.updateQuantity(quantity);
    this.recalculateTotals();
    this.props.updatedAt = new Date();
  }

  setAddress(address: OrderAddress): void {
    if (!this.props.status.isCreated()) {
      throw new OrderNotEditableError(this.props.status.getValue());
    }

    this.props.address = address;
    this.props.updatedAt = new Date();
  }

  createShipment(shipment: OrderShipment): void {
    if (
      !this.props.status.isFulfilled() &&
      this.props.status.getValue() !== "paid"
    ) {
      throw new InvalidOperationError(
        "Cannot create shipment for order that is not paid or fulfilled",
      );
    }

    this.props.shipments.push(shipment);
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new OrderShipmentCreatedEvent(this.props.id.getValue(), shipment.shipmentId),
    );
  }

  markAsPaid(): void {
    if (!this.props.address) {
      throw new OrderAddressRequiredError();
    }
    this.changeStatus(OrderStatus.paid());
  }

  markAsFulfilled(): void {
    if (this.props.shipments.length === 0) {
      throw new InvalidOperationError(
        "Cannot mark order as fulfilled without shipments",
      );
    }
    this.changeStatus(OrderStatus.fulfilled());
  }

  cancel(): void {
    if (this.props.status.isFulfilled()) {
      throw new OrderCancellationError("Order is already fulfilled");
    }
    this.changeStatus(OrderStatus.cancelled());
  }

  refund(): void {
    if (!this.props.status.isFulfilled() && !this.props.status.isPaid()) {
      throw new OrderRefundError("Order must be paid or fulfilled");
    }
    this.changeStatus(OrderStatus.refunded());
  }

  updateStatus(newStatus: OrderStatus): void {
    this.changeStatus(newStatus);
  }

  private changeStatus(newStatus: OrderStatus): void {
    const previousStatus = this.props.status;

    if (!previousStatus.canTransitionTo(newStatus)) {
      throw new InvalidOrderStatusTransitionError(
        previousStatus.getValue(),
        newStatus.getValue(),
      );
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new OrderStatusUpdatedEvent(
        this.props.id.getValue(),
        previousStatus.getValue(),
        newStatus.getValue(),
      ),
    );
  }

  updateTotals(tax: number, shipping: number, discount: number): void {
    const subtotal = this.calculateSubtotal();

    this.props.totals = OrderTotals.create({
      subtotal,
      tax,
      shipping,
      discount,
      total: subtotal + tax + shipping - discount,
    });

    this.props.updatedAt = new Date();
  }

  private recalculateTotals(): void {
    const subtotal = this.calculateSubtotal();
    const currentTotals = this.props.totals.getValue();

    this.props.totals = OrderTotals.create({
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
    return this.props.items.reduce(
      (sum, item) => sum + item.calculateSubtotal(),
      0,
    );
  }

  isGuestOrder(): boolean {
    return !!this.props.guestToken;
  }
  isUserOrder(): boolean {
    return !!this.props.userId;
  }
  hasAddress(): boolean {
    return !!this.props.address;
  }
  hasShipments(): boolean {
    return this.props.shipments.length > 0;
  }

  canBePaid(): boolean {
    return (
      this.props.status.isCreated() &&
      this.hasAddress() &&
      this.props.items.length > 0
    );
  }

  canBeFulfilled(): boolean {
    return this.props.status.isPaid() && this.hasShipments();
  }

  canBeCancelled(): boolean {
    return (
      !this.props.status.isFulfilled() &&
      !this.props.status.isCancelled() &&
      !this.props.status.isRefunded()
    );
  }

  canBeRefunded(): boolean {
    return this.props.status.isPaid() || this.props.status.isFulfilled();
  }

  getTotalItemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  equals(other: Order): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Order): OrderDTO {
    return {
      id: entity.props.id.getValue(),
      orderNumber: entity.props.orderNumber.getValue(),
      userId: entity.props.userId,
      guestToken: entity.props.guestToken,
      items: entity.props.items.map(OrderItem.toDTO),
      address: entity.props.address
        ? OrderAddress.toDTO(entity.props.address)
        : undefined,
      shipments: entity.props.shipments.map(OrderShipment.toDTO),
      totals: entity.props.totals.getValue(),
      status: entity.props.status.getValue(),
      source: entity.props.source.getValue(),
      currency: entity.props.currency.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

