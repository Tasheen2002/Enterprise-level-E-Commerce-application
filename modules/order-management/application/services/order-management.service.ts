import {
  IOrderRepository,
  OrderQueryOptions,
  OrderFilterOptions,
} from "../../domain/repositories/order.repository";
import { IOrderShipmentRepository } from "../../domain/repositories/order-shipment.repository";
import { IOrderStatusHistoryRepository } from "../../domain/repositories/order-status-history.repository";
import { IOrderAddressRepository } from "../../domain/repositories/order-address.repository";
import { StatusHistoryQueryOptions } from "../../domain/repositories/order-status-history.repository";
import {
  IExternalVariantService,
  IExternalProductService,
  IExternalStockService,
} from "../../domain/ports/external-services";
import { Order, OrderDTO } from "../../domain/entities/order.entity";
import { OrderId } from "../../domain/value-objects/order-id.vo";
import { ShipmentId } from "../../domain/value-objects/shipment-id.vo";
import { OrderNumber } from "../../domain/value-objects/order-number.vo";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";
import { Currency } from "../../../../packages/core/src/domain/value-objects/currency.vo";
import { OrderSource } from "../../domain/value-objects/order-source.vo";
import {
  OrderAddress,
  OrderAddressDTO,
} from "../../domain/entities/order-address.entity";
import {
  OrderItem,
  OrderItemDTO,
} from "../../domain/entities/order-item.entity";
import {
  OrderShipment,
  OrderShipmentDTO,
} from "../../domain/entities/order-shipment.entity";
import {
  OrderStatusHistory,
  OrderStatusHistoryDTO,
} from "../../domain/entities/order-status-history.entity";
import {
  OrderTotals,
  OrderTotalsData,
} from "../../domain/value-objects/order-totals.vo";
import { ProductSnapshot } from "../../domain/value-objects/product-snapshot.vo";
import {
  AddressSnapshot,
  AddressSnapshotData,
} from "../../domain/value-objects";
import {
  OrderNotFoundError,
  OrderItemNotFoundError,
  OrderShipmentNotFoundError,
  DomainValidationError,
  InvalidOperationError,
  ContactMismatchError,
  OrderAccessDeniedError,
} from "../../domain/errors/order-management.errors";

interface AddressParams {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface CreateOrderItemInput {
  variantId: string;
  quantity: number;
  isGift?: boolean;
  giftMessage?: string;
}

interface CreateOrderParams {
  userId?: string;
  guestToken?: string;
  items: CreateOrderItemInput[];
  shippingAddress: AddressParams;
  billingAddress?: AddressParams;
  source?: string;
  currency?: string;
}

export interface ListOrdersResult {
  items: OrderDTO[];
  total: number;
}

export interface TrackOrderResult {
  orderId: string;
  orderNumber: string;
  status: string;
  items: OrderItemDTO[];
  totals: OrderTotalsData;
  shipments: OrderShipmentDTO[];
  billingAddress: AddressSnapshotData | Record<string, never>;
  shippingAddress: AddressSnapshotData | Record<string, never>;
  createdAt: string;
  updatedAt: string;
}

export class OrderManagementService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderAddressRepository: IOrderAddressRepository,
    private readonly orderShipmentRepository: IOrderShipmentRepository,
    private readonly orderStatusHistoryRepository: IOrderStatusHistoryRepository,
    private readonly variantManagementService: IExternalVariantService,
    private readonly productManagementService: IExternalProductService,
    private readonly stockManagementService: IExternalStockService,
    // Default warehouse for stock reservations. Injected (rather than read
    // from `process.env` at call time) so this service is testable without
    // env stubbing and so config is bound once at container boot.
    private readonly defaultWarehouseId: string,
  ) {}

  // ─── Order Lifecycle ───────────────────────────────────────────────────────

  async createOrder(params: CreateOrderParams): Promise<OrderDTO> {
    const defaultLocationId = this.getDefaultWarehouseId();

    // Parallel fetch: stocks + variants for every item
    const [stocks, variants] = await Promise.all([
      Promise.all(
        params.items.map((i) =>
          this.stockManagementService.getStock(i.variantId, defaultLocationId),
        ),
      ),
      Promise.all(
        params.items.map((i) =>
          this.variantManagementService.getVariantById(i.variantId),
        ),
      ),
    ]);

    // Validate stock availability and variant existence
    params.items.forEach((itemData, i) => {
      const stock = stocks[i];
      if (!stock || stock.getStockLevel().getAvailable() < itemData.quantity) {
        throw new DomainValidationError(
          `Insufficient stock for variant ${itemData.variantId}`,
        );
      }
      if (!variants[i]) throw new OrderItemNotFoundError(itemData.variantId);
    });

    const products = await Promise.all(
      variants.map((v) =>
        this.productManagementService.getProductById(v!.getProductId().getValue()),
      ),
    );

    // Build OrderItems with a placeholder orderId. Order.create() generates
    // the real id; we re-stamp items via setOrderId() once it's known.
    const placeholderOrderId = OrderId.create().getValue();
    const items = params.items.map((itemData, i) =>
      this.buildOrderItem({
        orderId: placeholderOrderId,
        variantData: variants[i]!,
        productData: products[i],
        itemData,
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.calculateSubtotal(), 0);
    const totals = OrderTotals.create({
      subtotal,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: subtotal,
    });

    const order = Order.create({
      userId: params.userId,
      guestToken: params.guestToken,
      items,
      shipments: [],
      totals,
      source: OrderSource.fromString(params.source ?? "web"),
      currency: Currency.fromString(params.currency ?? "USD"),
    });

    // Re-stamp items with the real OrderId now that the aggregate has assigned one
    const realOrderId = order.id.getValue();
    for (const item of items) {
      item.setOrderId(realOrderId);
    }

    const billingSnap = AddressSnapshot.create(
      params.billingAddress ?? params.shippingAddress,
    );
    const shippingSnap = AddressSnapshot.create(params.shippingAddress);

    const address = OrderAddress.create({
      orderId: realOrderId,
      billingAddress: billingSnap,
      shippingAddress: shippingSnap,
    });
    order.setAddress(address);

    const statusHistory = OrderStatusHistory.create({
      orderId: realOrderId,
      fromStatus: OrderStatus.created(),
      toStatus: OrderStatus.created(),
      changedBy: "system",
    });
    await this.orderRepository.saveWithStatusHistory(order, statusHistory);

    try {
      await Promise.all(
        params.items.map((itemData) =>
          this.stockManagementService.reserveStock(
            itemData.variantId,
            defaultLocationId,
            itemData.quantity,
          ),
        ),
      );
    } catch (err) {
      order.cancel();
      await this.orderRepository.save(order);
      throw err;
    }

    return Order.toDTO(order);
  }

  async getOrderById(
    id: string,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderDTO | null> {
    const order = await this.orderRepository.findById(OrderId.fromString(id));
    if (!order) return null;
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    return Order.toDTO(order);
  }

  async getOrderByNumber(
    orderNumber: string,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderDTO | null> {
    const order = await this.orderRepository.findByOrderNumber(
      OrderNumber.fromString(orderNumber),
    );
    if (!order) return null;
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    return Order.toDTO(order);
  }

  async getAllOrders(options?: OrderQueryOptions): Promise<ListOrdersResult> {
    const [items, total] = await Promise.all([
      this.orderRepository.findAll(options),
      this.orderRepository.count(),
    ]);
    return { items: items.map(Order.toDTO), total };
  }

  async findOrders(
    filters: OrderFilterOptions,
    options: OrderQueryOptions | undefined,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<ListOrdersResult> {
    // Non-staff requesters can only see their own orders — force the userId
    // filter regardless of what was passed (defense against client tampering).
    const effectiveFilters: OrderFilterOptions = isStaff
      ? filters
      : { ...filters, userId: requestingUserId };

    const [items, total] = await Promise.all([
      this.orderRepository.findWithFilters(effectiveFilters, options),
      this.orderRepository.count(effectiveFilters),
    ]);
    return { items: items.map(Order.toDTO), total };
  }

  async cancelOrder(
    id: string,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderDTO> {
    const order = await this.requireOrder(id);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    order.cancel();
    await this.orderRepository.save(order);

    
    const defaultLocationId = this.getDefaultWarehouseId();
    await Promise.all(
      order.items.map(async (item) => {
        try {
          await this.stockManagementService.releaseStock(
            item.variantId,
            defaultLocationId,
            item.quantity,
          );
        } catch {
          /* best-effort release — stock may have already been fulfilled */
        }
      }),
    );

    return Order.toDTO(order);
  }

  async markOrderAsPaid(id: string): Promise<OrderDTO> {
    const order = await this.requireOrder(id);
    order.markAsPaid();
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async markOrderAsFulfilled(id: string): Promise<OrderDTO> {
    const order = await this.requireOrder(id);
    order.markAsFulfilled();
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }


  async updateOrderStatus(orderId: string, status: string): Promise<OrderDTO> {
    const order = await this.requireOrder(orderId);
    order.updateStatus(OrderStatus.fromString(status));
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async updateOrderTotals(
    orderId: string,
    totals: { tax: number; shipping: number; discount: number },
  ): Promise<OrderDTO> {
    const order = await this.requireOrder(orderId);
    order.updateTotals(totals.tax, totals.shipping, totals.discount);
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async updateOrderItem(params: {
    orderId: string;
    itemId: string;
    quantity?: number;
    isGift?: boolean;
    giftMessage?: string;
    requestingUserId: string;
    isStaff: boolean;
  }): Promise<OrderDTO> {
    const order = await this.requireOrder(params.orderId);
    this.assertCanAccessOrder(order, params.requestingUserId, params.isStaff);

    if (params.quantity !== undefined) {
      order.updateItemQuantity(params.itemId, params.quantity);
    }

    if (params.isGift !== undefined) {
      const item = order.items.find(
        (i) => i.orderItemId.getValue() === params.itemId,
      );
      if (!item) throw new OrderItemNotFoundError(params.itemId);
      if (params.isGift) item.setAsGift(params.giftMessage);
      else item.removeGift();
    }

    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async deleteOrder(id: string): Promise<void> {
    const orderId = OrderId.fromString(id);
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new OrderNotFoundError(id);
    await this.orderRepository.delete(orderId);
  }

  // ─── Address Management ────────────────────────────────────────────────────

  async getOrderAddress(
    orderId: string,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderAddressDTO | null> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    const address = await this.orderAddressRepository.findByOrderId(
      OrderId.fromString(orderId),
    );
    return address ? OrderAddress.toDTO(address) : null;
  }

  async updateShippingAddress(
    orderId: string,
    params: AddressParams,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderAddressDTO> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    const address = await this.requireOrderAddress(orderId);
    address.updateShippingAddress(AddressSnapshot.create(params));
    await this.orderAddressRepository.save(address);
    return OrderAddress.toDTO(address);
  }

  async updateBillingAddress(
    orderId: string,
    params: AddressParams,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderAddressDTO> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    const address = await this.requireOrderAddress(orderId);
    address.updateBillingAddress(AddressSnapshot.create(params));
    await this.orderAddressRepository.save(address);
    return OrderAddress.toDTO(address);
  }

  async setOrderAddress(
    orderId: string,
    billingAddress: AddressSnapshotData,
    shippingAddress: AddressSnapshotData,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderAddressDTO> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);

    const id = OrderId.fromString(orderId);
    const existing = await this.orderAddressRepository.findByOrderId(id);

    if (existing) {
      existing.updateBillingAddress(AddressSnapshot.create(billingAddress));
      existing.updateShippingAddress(AddressSnapshot.create(shippingAddress));
      await this.orderAddressRepository.save(existing);
      return OrderAddress.toDTO(existing);
    }

    const address = OrderAddress.create({
      orderId: id.getValue(),
      billingAddress: AddressSnapshot.create(billingAddress),
      shippingAddress: AddressSnapshot.create(shippingAddress),
    });
    await this.orderAddressRepository.save(address);
    return OrderAddress.toDTO(address);
  }

  // ─── Order Item Management ────────────────────────────────────────────────

  async addOrderItem(
    orderId: string,
    data: CreateOrderItemInput,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderDTO> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    const defaultLocationId = this.getDefaultWarehouseId();

    const [stock, variant] = await Promise.all([
      this.stockManagementService.getStock(data.variantId, defaultLocationId),
      this.variantManagementService.getVariantById(data.variantId),
    ]);

    if (!stock || stock.getStockLevel().getAvailable() < data.quantity) {
      throw new DomainValidationError(
        `Insufficient stock for variant ${data.variantId}`,
      );
    }
    if (!variant) throw new OrderItemNotFoundError(data.variantId);

    const product = await this.productManagementService.getProductById(
      variant.getProductId().getValue(),
    );

    const orderItem = this.buildOrderItem({
      orderId: order.id.getValue(),
      variantData: variant,
      productData: product,
      itemData: data,
    });

    order.addItem(orderItem);
    await this.orderRepository.save(order);

    await this.stockManagementService.reserveStock(
      data.variantId,
      defaultLocationId,
      data.quantity,
    );

    return Order.toDTO(order);
  }

  async removeOrderItem(
    orderId: string,
    itemId: string,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderDTO> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    order.removeItem(itemId);
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  // ─── Order Shipment Management ────────────────────────────────────────────

  async createShipment(data: {
    orderId: string;
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    giftReceipt?: boolean;
    pickupLocationId?: string;
  }): Promise<OrderShipmentDTO> {
    const order = await this.requireOrder(data.orderId);

    const shipment = OrderShipment.create({
      orderId: order.id.getValue(),
      carrier: data.carrier,
      service: data.service,
      trackingNumber: data.trackingNumber,
      giftReceipt: data.giftReceipt ?? false,
      pickupLocationId: data.pickupLocationId,
    });

    // Goes through the aggregate to enforce the paid/fulfilled guard
    order.createShipment(shipment);
    await this.orderRepository.save(order);
    return OrderShipment.toDTO(shipment);
  }

  async markShipmentShipped(data: {
    orderId: string;
    shipmentId: string;
    carrier: string;
    service: string;
    trackingNumber: string;
  }): Promise<OrderShipmentDTO> {
    const shipment = await this.requireShipmentForOrder(
      data.orderId,
      data.shipmentId,
    );
    shipment.markAsShipped(data.carrier, data.service, data.trackingNumber);
    await this.orderShipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async markShipmentDelivered(data: {
    orderId: string;
    shipmentId: string;
    deliveredAt?: Date;
  }): Promise<OrderShipmentDTO> {
    const shipment = await this.requireShipmentForOrder(
      data.orderId,
      data.shipmentId,
    );
    shipment.markAsDelivered(data.deliveredAt);
    await this.orderShipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async updateShipmentTracking(data: {
    orderId: string;
    shipmentId: string;
    trackingNumber: string;
    carrier?: string;
    service?: string;
  }): Promise<OrderShipmentDTO> {
    const shipment = await this.requireShipmentForOrder(
      data.orderId,
      data.shipmentId,
    );
    shipment.updateTrackingNumber(data.trackingNumber);
    if (data.carrier) shipment.updateCarrier(data.carrier);
    if (data.service) shipment.updateService(data.service);
    await this.orderShipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async getOrderShipments(orderId: string): Promise<OrderShipmentDTO[]> {
    const shipments = await this.orderShipmentRepository.findByOrderId(
      OrderId.fromString(orderId),
    );
    return shipments.map(OrderShipment.toDTO);
  }

  async getShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipmentDTO | null> {
    const trimmed = trackingNumber.trim();
    if (trimmed.length === 0) {
      throw new DomainValidationError("Tracking number is required");
    }
    const shipment =
      await this.orderShipmentRepository.findByTrackingNumber(trimmed);
    return shipment ? OrderShipment.toDTO(shipment) : null;
  }

  
  // `fromStatus` is always derived from the order's current state — never
  // accepted from the API caller — to keep the audit trail honest.
  // `changedBy` is required for API callers (always set from session); internal
  // callers (sagas, system events) can pass "system" or a service identifier.
  async logOrderStatusChange(data: {
    orderId: string;
    toStatus: string;
    changedBy: string;
  }): Promise<OrderStatusHistoryDTO> {
    const order = await this.requireOrder(data.orderId);
    const id = order.id.getValue();
    const currentStatus = order.status.getValue();

    if (currentStatus !== data.toStatus) {
      order.updateStatus(OrderStatus.fromString(data.toStatus));
      await this.orderRepository.save(order);
    }

    const history = OrderStatusHistory.create({
      orderId: id,
      fromStatus: OrderStatus.fromString(currentStatus),
      toStatus: OrderStatus.fromString(data.toStatus),
      changedBy: data.changedBy,
    });

    await this.orderStatusHistoryRepository.save(history);
    return OrderStatusHistory.toDTO(history);
  }

  async getOrderStatusHistory(
    orderId: string,
    options: StatusHistoryQueryOptions | undefined,
    requestingUserId: string,
    isStaff: boolean,
  ): Promise<OrderStatusHistoryDTO[]> {
    const order = await this.requireOrder(orderId);
    this.assertCanAccessOrder(order, requestingUserId, isStaff);
    const history = await this.orderStatusHistoryRepository.findByOrderId(
      OrderId.fromString(orderId),
      options,
    );
    return history.map(OrderStatusHistory.toDTO);
  }

  // ─── Customer Order Tracking ──────────────────────────────────────────────

  async trackOrder(query: {
    orderNumber?: string;
    contact?: string;
    trackingNumber?: string;
  }): Promise<TrackOrderResult> {
    if (query.orderNumber && query.contact) {
      return this.trackByOrderNumber(query.orderNumber, query.contact);
    }
    if (query.trackingNumber) {
      return this.trackByTrackingNumber(query.trackingNumber);
    }
    throw new DomainValidationError(
      "Provide either orderNumber + contact, or a trackingNumber",
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async requireOrder(id: string): Promise<Order> {
    const orderId = OrderId.fromString(id);
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new OrderNotFoundError(orderId.getValue());
    return order;
  }

  private async requireOrderAddress(orderId: string): Promise<OrderAddress> {
    const id = OrderId.fromString(orderId);
    const address = await this.orderAddressRepository.findByOrderId(id);
    if (!address) throw new OrderNotFoundError(id.getValue());
    return address;
  }

  // Staff bypass for routes where staff need to read/act on any order
  // (admin overrides, customer service, analytics). Non-staff must own the order.
  private assertCanAccessOrder(
    order: Order,
    requestingUserId: string,
    isStaff: boolean,
  ): void {
    if (isStaff) return;
    if (!order.belongsToUser(requestingUserId)) {
      throw new OrderAccessDeniedError();
    }
  }

  private async requireShipmentForOrder(
    orderId: string,
    shipmentId: string,
  ): Promise<OrderShipment> {
    const shipment = await this.orderShipmentRepository.findById(
      ShipmentId.fromString(shipmentId),
    );
    if (!shipment) throw new OrderShipmentNotFoundError(shipmentId);
    if (shipment.orderId !== orderId) {
      throw new InvalidOperationError("Shipment does not belong to this order");
    }
    return shipment;
  }

  private buildOrderItem(args: {
    orderId: string;
    variantData: NonNullable<
      Awaited<ReturnType<IExternalVariantService["getVariantById"]>>
    >;
    productData: Awaited<
      ReturnType<IExternalProductService["getProductById"]>
    >;
    itemData: CreateOrderItemInput;
  }): OrderItem {
    const { orderId, variantData, productData, itemData } = args;
    if (!productData) throw new DomainValidationError("Product not found");

    const productSnapshot = ProductSnapshot.create({
      productId: variantData.getProductId().getValue(),
      variantId: variantData.getId().getValue(),
      sku: variantData.getSku().getValue(),
      name: productData.getTitle(),
      price: productData.getPrice().getValue(),
    });

    return OrderItem.create({
      orderId,
      variantId: itemData.variantId,
      quantity: itemData.quantity,
      productSnapshot,
      isGift: itemData.isGift ?? false,
      giftMessage: itemData.giftMessage,
    });
  }

  private async trackByOrderNumber(
    orderNumber: string,
    contact: string,
  ): Promise<TrackOrderResult> {
    // Guest-tracking auth is the contact match below — bypass userId ownership
    // by going repo-direct rather than through the gated getOrderByNumber.
    const orderEntity = await this.orderRepository.findByOrderNumber(
      OrderNumber.fromString(orderNumber),
    );
    if (!orderEntity) throw new OrderNotFoundError(orderNumber);
    const order = Order.toDTO(orderEntity);

    const orderAddressEntity = await this.orderAddressRepository.findByOrderId(
      OrderId.fromString(order.id),
    );
    const orderAddress = orderAddressEntity
      ? OrderAddress.toDTO(orderAddressEntity)
      : null;
    const billing = orderAddress?.billingAddress;
    const shipping = orderAddress?.shippingAddress;

    const contactLower = contact.toLowerCase().trim();
    const contactMatches =
      contactLower === billing?.email?.toLowerCase().trim() ||
      contactLower === shipping?.email?.toLowerCase().trim() ||
      contact === billing?.phone?.trim() ||
      contact === shipping?.phone?.trim();

    if (!contactMatches) throw new ContactMismatchError();

    const shipments = await this.getOrderShipments(order.id);
    const emptyAddress: Record<string, never> = {};

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      totals: order.totals,
      shipments,
      billingAddress: billing ?? emptyAddress,
      shippingAddress: shipping ?? emptyAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async trackByTrackingNumber(
    trackingNumber: string,
  ): Promise<TrackOrderResult> {
    const shipmentDTO = await this.getShipmentByTrackingNumber(trackingNumber);
    if (!shipmentDTO) throw new OrderShipmentNotFoundError(trackingNumber);

    // Tracking-number auth is the (assumed-private) tracking number itself —
    // bypass userId ownership by going repo-direct.
    const orderEntity = await this.orderRepository.findById(
      OrderId.fromString(shipmentDTO.orderId),
    );
    if (!orderEntity) throw new OrderNotFoundError(shipmentDTO.orderId);
    const order = Order.toDTO(orderEntity);

    const emptyAddress: Record<string, never> = {};

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      totals: order.totals,
      shipments: [shipmentDTO],
      billingAddress: emptyAddress,
      shippingAddress: emptyAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // Returns the constructor-injected default warehouse id and validates
  // it's set. Container resolves this from `process.env.DEFAULT_STOCK_LOCATION`
  // at boot — keeping the env read out of the service itself.
  private getDefaultWarehouseId(): string {
    if (!this.defaultWarehouseId) {
      throw new DomainValidationError(
        "No warehouse location configured. Please set DEFAULT_STOCK_LOCATION in .env.",
      );
    }
    return this.defaultWarehouseId;
  }
}
