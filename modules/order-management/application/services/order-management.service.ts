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
} from "../../domain/external-services";
import { Order, OrderDTO } from "../../domain/entities/order.entity";
import { OrderId } from "../../domain/value-objects/order-id.vo";
import { OrderNumber } from "../../domain/value-objects/order-number.vo";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";
import { Currency } from "../../domain/value-objects/currency.vo";
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

interface CreateOrderParams {
  userId?: string;
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
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
  ) {}

  async createOrder(params: CreateOrderParams): Promise<OrderDTO> {
    const defaultLocationId = this.getDefaultWarehouseId();

    // Bug 6 fix: parallelize all per-item external calls across all items at once
    const [stocks, variants] = await Promise.all([
      Promise.all(
        params.items.map((item) =>
          this.stockManagementService.getStock(
            item.variantId,
            defaultLocationId,
          ),
        ),
      ),
      Promise.all(
        params.items.map((item) =>
          this.variantManagementService.getVariantById(item.variantId),
        ),
      ),
    ]);

    // Validate stock and variants, then fetch products in parallel
    for (let i = 0; i < params.items.length; i++) {
      const itemData = params.items[i];
      const stock = stocks[i];
      const variant = variants[i];
      if (!stock || stock.getStockLevel().getAvailable() < itemData.quantity) {
        throw new DomainValidationError(
          `Insufficient stock for variant ${itemData.variantId}`,
        );
      }
      if (!variant) throw new OrderItemNotFoundError(itemData.variantId);
    }

    const products = await Promise.all(
      variants.map((variant) =>
        this.productManagementService.getProductById(
          variant!.getProductId().getValue(),
        ),
      ),
    );

    // Build items using a placeholder orderId — the real orderId is assigned
    // after Order.create() generates it, then items are re-stamped below.
    const placeholderOrderId = OrderId.create().getValue();
    const items: OrderItem[] = [];
    let subtotal = 0;

    for (let i = 0; i < params.items.length; i++) {
      const itemData = params.items[i];
      const variant = variants[i]!;
      const product = products[i];
      if (!product) throw new DomainValidationError("Product not found");

      const productSnapshot = ProductSnapshot.create({
        productId: variant.getProductId().getValue(),
        variantId: variant.getId().getValue(),
        sku: variant.getSku().getValue(),
        name: product.getTitle(),
        price: product.getPrice().getValue(),
      });

      const orderItem = OrderItem.create({
        orderId: placeholderOrderId,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
        productSnapshot,
        isGift: itemData.isGift ?? false,
        giftMessage: itemData.giftMessage,
      });

      subtotal += orderItem.calculateSubtotal();
      items.push(orderItem);
    }

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

    // Stamp the real orderId onto all items now that Order.create() has assigned it
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

    const statusHistory = OrderStatusHistory.create({
      orderId: realOrderId,
      fromStatus: OrderStatus.created(),
      toStatus: OrderStatus.created(),
      changedBy: "system",
    });

    // Bug 1 fix: save order, address, and status history together before touching stock.
    // These are all DB writes — keep them atomic so a stock failure doesn't leave ghost orders.
    await this.orderRepository.save(order);
    await this.orderAddressRepository.save(address);
    await this.orderStatusHistoryRepository.save(statusHistory);

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
      // Compensate: cancel the order so it doesn't sit as a ghost CREATED order
      order.cancel();
      await this.orderRepository.save(order);
      throw err;
    }

    return Order.toDTO(order);
  }

  async getOrderById(id: string): Promise<OrderDTO | null> {
    const order = await this.orderRepository.findById(OrderId.fromString(id));
    return order ? Order.toDTO(order) : null;
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderDTO | null> {
    const order = await this.orderRepository.findByOrderNumber(
      OrderNumber.fromString(orderNumber),
    );
    return order ? Order.toDTO(order) : null;
  }

  async getAllOrders(options?: OrderQueryOptions): Promise<ListOrdersResult> {
    const items = await this.orderRepository.findAll(options);
    const total = await this.orderRepository.count();
    return { items: items.map(Order.toDTO), total };
  }

  async findOrders(
    filters: OrderFilterOptions,
    options?: OrderQueryOptions,
  ): Promise<ListOrdersResult> {
    const items = await this.orderRepository.findWithFilters(filters, options);
    const total = await this.orderRepository.count(filters);
    return { items: items.map(Order.toDTO), total };
  }

  async cancelOrder(id: string): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(OrderId.fromString(id));
    if (!order) throw new OrderNotFoundError(id);
    order.cancel();
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async markOrderAsPaid(id: string): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(OrderId.fromString(id));
    if (!order) throw new OrderNotFoundError(id);
    order.markAsPaid();
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async markOrderAsFulfilled(id: string): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(OrderId.fromString(id));
    if (!order) throw new OrderNotFoundError(id);
    order.markAsFulfilled();
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );
    if (!order) throw new OrderNotFoundError(orderId);
    order.updateStatus(OrderStatus.fromString(status));
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async updateOrderTotals(
    orderId: string,
    totals: { tax: number; shipping: number; discount: number },
  ): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );
    if (!order) throw new OrderNotFoundError(orderId);
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
  }): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(params.orderId),
    );
    if (!order) throw new OrderNotFoundError(params.orderId);

    if (params.quantity !== undefined) {
      order.updateItemQuantity(params.itemId, params.quantity);
    }

    // Bug 3 fix: apply isGift/giftMessage changes that were previously silently dropped
    if (params.isGift === true) {
      const item = order.items.find((i) => i.orderItemId === params.itemId);
      if (!item) throw new OrderItemNotFoundError(params.itemId);
      item.setAsGift(params.giftMessage);
    } else if (params.isGift === false) {
      const item = order.items.find((i) => i.orderItemId === params.itemId);
      if (!item) throw new OrderItemNotFoundError(params.itemId);
      item.removeGift();
    }

    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  async markShipmentShipped(data: {
    orderId: string;
    shipmentId: string;
    carrier: string;
    service: string;
    trackingNumber: string;
  }): Promise<OrderShipmentDTO> {
    const shipment = await this.orderShipmentRepository.findById(
      data.shipmentId,
    );
    if (!shipment) throw new OrderShipmentNotFoundError(data.shipmentId);
    if (shipment.orderId !== data.orderId)
      throw new InvalidOperationError("Shipment does not belong to this order");
    shipment.markAsShipped(data.carrier, data.service, data.trackingNumber);
    await this.orderShipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async markShipmentDelivered(data: {
    orderId: string;
    shipmentId: string;
    deliveredAt?: Date;
  }): Promise<OrderShipmentDTO> {
    const shipment = await this.orderShipmentRepository.findById(
      data.shipmentId,
    );
    if (!shipment) throw new OrderShipmentNotFoundError(data.shipmentId);
    if (shipment.orderId !== data.orderId)
      throw new InvalidOperationError("Shipment does not belong to this order");
    shipment.markAsDelivered();
    await this.orderShipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async deleteOrder(id: string): Promise<void> {
    const orderId = OrderId.fromString(id);
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new OrderNotFoundError(id);
    await this.orderRepository.delete(orderId);
  }

  // ============================================================================
  // ADDRESS MANAGEMENT
  // ============================================================================

  async getOrderAddress(orderId: string): Promise<OrderAddressDTO | null> {
    const address = await this.orderAddressRepository.findByOrderId(orderId);
    return address ? OrderAddress.toDTO(address) : null;
  }

  async updateShippingAddress(
    orderId: string,
    params: AddressParams,
  ): Promise<OrderAddressDTO> {
    const existing = await this.orderAddressRepository.findByOrderId(orderId);
    if (!existing) throw new OrderNotFoundError(orderId);
    existing.updateShippingAddress(AddressSnapshot.create(params));
    await this.orderAddressRepository.save(existing);
    return OrderAddress.toDTO(existing);
  }

  async updateBillingAddress(
    orderId: string,
    params: AddressParams,
  ): Promise<OrderAddressDTO> {
    const existing = await this.orderAddressRepository.findByOrderId(orderId);
    if (!existing) throw new OrderNotFoundError(orderId);
    existing.updateBillingAddress(AddressSnapshot.create(params));
    await this.orderAddressRepository.save(existing);
    return OrderAddress.toDTO(existing);
  }

  async setOrderAddress(
    orderId: string,
    billingAddress: AddressSnapshotData,
    shippingAddress: AddressSnapshotData,
  ): Promise<OrderAddressDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );
    if (!order) throw new OrderNotFoundError(orderId);

    const existing = await this.orderAddressRepository.findByOrderId(orderId);

    if (existing) {
      existing.updateBillingAddress(AddressSnapshot.create(billingAddress));
      existing.updateShippingAddress(AddressSnapshot.create(shippingAddress));
      await this.orderAddressRepository.save(existing);
      return OrderAddress.toDTO(existing);
    }

    const address = OrderAddress.create({
      orderId,
      billingAddress: AddressSnapshot.create(billingAddress),
      shippingAddress: AddressSnapshot.create(shippingAddress),
    });
    await this.orderAddressRepository.save(address);
    return OrderAddress.toDTO(address);
  }

  // ============================================================================
  // ORDER ITEM MANAGEMENT
  // ============================================================================

  async addOrderItem(
    orderId: string,
    data: {
      variantId: string;
      quantity: number;
      isGift?: boolean;
      giftMessage?: string;
    },
  ): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );
    if (!order) throw new OrderNotFoundError(orderId);

    const defaultLocationId = this.getDefaultWarehouseId();
    const stock = await this.stockManagementService.getStock(
      data.variantId,
      defaultLocationId,
    );
    if (!stock || stock.getStockLevel().getAvailable() < data.quantity) {
      throw new DomainValidationError(
        `Insufficient stock for variant ${data.variantId}`,
      );
    }

    const variant = await this.variantManagementService.getVariantById(
      data.variantId,
    );
    if (!variant) throw new OrderItemNotFoundError(data.variantId);

    const product = await this.productManagementService.getProductById(
      variant.getProductId().getValue(),
    );
    if (!product) throw new DomainValidationError("Product not found");

    const productSnapshot = ProductSnapshot.create({
      productId: variant.getProductId().getValue(),
      variantId: variant.getId().getValue(),
      sku: variant.getSku().getValue(),
      name: product.getTitle(),
      price: product.getPrice().getValue(),
    });

    const orderItem = OrderItem.create({
      orderId,
      variantId: data.variantId,
      quantity: data.quantity,
      productSnapshot,
      isGift: data.isGift ?? false,
      giftMessage: data.giftMessage,
    });

    order.addItem(orderItem);
    await this.orderRepository.save(order);

    // Bug 7 fix: use reserveStock (soft hold) to match the createOrder pattern
    await this.stockManagementService.reserveStock(
      data.variantId,
      defaultLocationId,
      data.quantity,
    );

    return Order.toDTO(order);
  }

  async removeOrderItem(orderId: string, itemId: string): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );
    if (!order) throw new OrderNotFoundError(orderId);
    order.removeItem(itemId);
    await this.orderRepository.save(order);
    return Order.toDTO(order);
  }

  // ============================================================================
  // ORDER SHIPMENT MANAGEMENT
  // ============================================================================

  async createShipment(data: {
    orderId: string;
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    giftReceipt?: boolean;
    pickupLocationId?: string;
  }): Promise<OrderShipmentDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(data.orderId),
    );
    if (!order) throw new OrderNotFoundError(data.orderId);

    // Bug 2 fix: go through order.createShipment() to enforce the paid/fulfilled guard
    const shipment = OrderShipment.create({
      orderId: data.orderId,
      carrier: data.carrier,
      service: data.service,
      trackingNumber: data.trackingNumber,
      giftReceipt: data.giftReceipt ?? false,
      pickupLocationId: data.pickupLocationId,
    });

    order.createShipment(shipment);
    await this.orderRepository.save(order);
    return OrderShipment.toDTO(shipment);
  }

  async updateShipmentTracking(data: {
    orderId: string;
    shipmentId: string;
    trackingNumber: string;
    carrier?: string;
    service?: string;
  }): Promise<OrderShipmentDTO> {
    const shipment = await this.orderShipmentRepository.findById(
      data.shipmentId,
    );
    if (!shipment) throw new OrderShipmentNotFoundError(data.shipmentId);

    if (shipment.orderId !== data.orderId) {
      throw new InvalidOperationError("Shipment does not belong to this order");
    }

    shipment.updateTrackingNumber(data.trackingNumber);
    if (data.carrier) shipment.updateCarrier(data.carrier);
    if (data.service) shipment.updateService(data.service);

    await this.orderShipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async getOrderShipments(orderId: string): Promise<OrderShipmentDTO[]> {
    const shipments = await this.orderShipmentRepository.findByOrderId(orderId);
    return shipments.map(OrderShipment.toDTO);
  }

  // ============================================================================
  // STATUS HISTORY
  // ============================================================================

  async logOrderStatusChange(data: {
    orderId: string;
    fromStatus?: string;
    toStatus: string;
    changedBy?: string;
  }): Promise<OrderStatusHistoryDTO> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(data.orderId),
    );
    if (!order) throw new OrderNotFoundError(data.orderId);

    const currentStatus = order.status.getValue();
    const fromStatus = data.fromStatus ?? currentStatus;

    if (currentStatus !== data.toStatus) {
      order.updateStatus(OrderStatus.fromString(data.toStatus));
      await this.orderRepository.save(order);
    }

    const history = OrderStatusHistory.create({
      orderId: data.orderId,
      fromStatus: OrderStatus.fromString(fromStatus),
      toStatus: OrderStatus.fromString(data.toStatus),
      changedBy: data.changedBy,
    });

    await this.orderStatusHistoryRepository.save(history);
    return OrderStatusHistory.toDTO(history);
  }

  async getOrderStatusHistory(
    orderId: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistoryDTO[]> {
    const history = await this.orderStatusHistoryRepository.findByOrderId(
      orderId,
      options,
    );
    return history.map(OrderStatusHistory.toDTO);
  }

  async getShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipmentDTO | null> {
    const shipment =
      await this.orderShipmentRepository.findByTrackingNumber(trackingNumber);
    return shipment ? OrderShipment.toDTO(shipment) : null;
  }

  async trackOrder(query: {
    orderNumber?: string;
    contact?: string;
    trackingNumber?: string;
  }): Promise<TrackOrderResult> {
    if (query.orderNumber && query.contact) {
      const order = await this.getOrderByNumber(query.orderNumber);
      if (!order) throw new OrderNotFoundError(query.orderNumber);

      const orderAddress = await this.getOrderAddress(order.id);
      const billing = orderAddress?.billingAddress;
      const shipping = orderAddress?.shippingAddress;

      const contactLower = query.contact.toLowerCase().trim();
      const contactMatches =
        contactLower === billing?.email?.toLowerCase().trim() ||
        contactLower === shipping?.email?.toLowerCase().trim() ||
        query.contact === billing?.phone?.trim() ||
        query.contact === shipping?.phone?.trim();

      if (!contactMatches) {
        throw new ContactMismatchError();
      }

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

    if (query.trackingNumber) {
      const shipmentDTO = await this.getShipmentByTrackingNumber(
        query.trackingNumber,
      );
      if (!shipmentDTO)
        throw new OrderShipmentNotFoundError(query.trackingNumber);

      // Bug 4 fix: fetch the actual order instead of returning an empty shell
      const order = await this.getOrderById(shipmentDTO.orderId);
      if (!order) throw new OrderNotFoundError(shipmentDTO.orderId);

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

    throw new DomainValidationError(
      "Provide either orderNumber + contact, or a trackingNumber",
    );
  }

  private getDefaultWarehouseId(): string {
    const locationId = process.env.DEFAULT_STOCK_LOCATION;
    if (!locationId) {
      throw new DomainValidationError(
        "No warehouse location configured. Please set DEFAULT_STOCK_LOCATION in .env.",
      );
    }
    return locationId;
  }
}
