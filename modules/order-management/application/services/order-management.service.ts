import {
  IOrderRepository,
  OrderQueryOptions,
  OrderFilterOptions,
} from "../../domain/repositories/order.repository";
import { IOrderAddressRepository } from "../../domain/repositories/order-address.repository";
import { IOrderItemRepository } from "../../domain/repositories/order-item.repository";
import { IOrderShipmentRepository } from "../../domain/repositories/order-shipment.repository";
import {
  IOrderStatusHistoryRepository,
  StatusHistoryQueryOptions,
} from "../../domain/repositories/order-status-history.repository";
import { Order, OrderAddress, OrderItem } from "../../domain/entities";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";
import { OrderStatusHistory } from "../../domain/entities/order-status-history.entity";
import { OrderId } from "../../domain/value-objects/order-id.vo";
import { OrderNumber } from "../../domain/value-objects/order-number.vo";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";
import { OrderSource } from "../../domain/value-objects/order-source.vo";
import { Currency } from "../../domain/value-objects/currency.vo";
import { ProductSnapshot } from "../../domain/value-objects/product-snapshot.vo";
import { AddressSnapshot } from "../../domain/value-objects/address-snapshot.vo";
import { VariantManagementService } from "../../../product-catalog/application/services/variant-management.service";
import { ProductManagementService } from "../../../product-catalog/application/services/product-management.service";
import { ProductMediaManagementService } from "../../../product-catalog/application/services/product-media-management.service";
import { StockManagementService } from "../../../inventory-management/application/services/stock-management.service";
import { OrderEventService } from "./order-event.service";

export interface CreateOrderData {
  userId?: string;
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
  source?: string;
  currency: string;
  paymentIntentId?: string;
  locationId?: string;
}

export class OrderManagementService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderAddressRepository: IOrderAddressRepository,
    private readonly orderItemRepository: IOrderItemRepository,
    private readonly orderShipmentRepository: IOrderShipmentRepository,
    private readonly orderStatusHistoryRepository: IOrderStatusHistoryRepository,
    private readonly variantManagementService: VariantManagementService,
    private readonly productManagementService: ProductManagementService,
    private readonly productMediaService: ProductMediaManagementService,
    private readonly stockManagementService: StockManagementService,
    private readonly orderEventService: OrderEventService,
  ) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    // Validate that either userId or guestToken is provided
    if (!data.userId && !data.guestToken) {
      throw new Error("Order must have either userId or guestToken");
    }

    if (data.userId && data.guestToken) {
      throw new Error("Order cannot have both userId and guestToken");
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    // Create value objects
    const source = OrderSource.fromString(data.source || "web");
    const currency = Currency.create(data.currency);

    // Fetch variant details from database and build productSnapshots
    const orderItems = await Promise.all(
      data.items.map(async (item) => {
        // Fetch variant from database
        const variant = await this.variantManagementService.getVariantById(
          item.variantId,
        );

        if (!variant) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }

        // Fetch product details
        const product = await this.productManagementService.getProductById(
          variant.getProductId().getValue(),
        );

        if (!product) {
          throw new Error(`Product not found for variant: ${item.variantId}`);
        }

        // Fetch product media (cover image)
        let imageUrl: string | undefined;
        try {
          const media = await this.productMediaService.getProductMedia(
            product.getId().getValue(),
            { coverOnly: true },
          );

          let coverAsset = media.mediaAssets.find((a) => a.isCover);
          if (!coverAsset && media.mediaAssets.length > 0) {
            coverAsset = media.mediaAssets[0];
          }

          if (coverAsset && coverAsset.storageKey) {
            imageUrl = coverAsset.storageKey;
          }
        } catch (error) {
          // Continue without image
        }

        // Build variant name from size and color
        const variantNameParts = [];
        if (variant.getSize()) variantNameParts.push(variant.getSize());
        if (variant.getColor()) variantNameParts.push(variant.getColor());
        const variantName =
          variantNameParts.length > 0
            ? variantNameParts.join(" / ")
            : undefined;

        // Map variant dimensions to the expected format
        const variantDims = variant.getDims();
        const dimensions =
          variantDims &&
          typeof variantDims.length === "number" &&
          typeof variantDims.width === "number" &&
          typeof variantDims.height === "number"
            ? {
                length: variantDims.length,
                width: variantDims.width,
                height: variantDims.height,
              }
            : undefined;

        // Build productSnapshot from database data (security: use DB price, not frontend price)
        const productSnapshot = ProductSnapshot.create({
          productId: variant.getProductId().getValue(),
          variantId: variant.getId().getValue(),
          sku: variant.getSku().getValue(),
          name: product.getTitle(),
          variantName,
          price: product.getPrice().getValue(),
          imageUrl,
          weight: variant.getWeightG() || undefined,
          dimensions,
          attributes: {
            size: variant.getSize(),
            color: variant.getColor(),
          },
        });

        return {
          variantId: item.variantId,
          quantity: item.quantity,
          productSnapshot,
          isGift: item.isGift,
          giftMessage: item.giftMessage,
        };
      }),
    );

    const defaultLocationId =
      data.locationId || (this.getDefaultWarehouseId());
    for (const item of orderItems) {
      const stock = await this.stockManagementService.getStock(
        item.variantId,
        defaultLocationId,
      );
      const available = stock?.getStockLevel().getAvailable() ?? 0;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for variant ${item.variantId} at ${defaultLocationId}`,
        );
      }
    }

    // Create the order entity
    const order = Order.create({
      userId: data.userId,
      guestToken: data.guestToken,
      items: orderItems,
      source,
      currency,
      tax: 0,
      shipping: 0,
      discount: 0,
    });

    await this.orderRepository.save(order);

    // Remove stock from inventory (no reservation was made during direct order creation)
    for (const item of orderItems) {
      await this.stockManagementService.adjustStock(
        item.variantId,
        defaultLocationId,
        -item.quantity, // Negative to remove stock
        "order",
        order.getOrderId().getValue(), // Reference the order ID
      );
    }

    await this.orderEventService.logOrderCreated(
      order.getOrderId().getValue(),
      {
        userId: data.userId,
        guestToken: data.guestToken,
        itemCount: data.items.length,
        currency: data.currency,
        source: data.source,
      },
    );

    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    try {
      const orderId = OrderId.fromString(id);
      return await this.orderRepository.findById(orderId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("valid UUID")) {
        throw new Error("Invalid order ID format");
      }
      throw error;
    }
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
    if (!orderNumber || orderNumber.trim().length === 0) {
      throw new Error("Order number is required");
    }

    try {
      const orderNum = OrderNumber.create(orderNumber.trim());
      return await this.orderRepository.findByOrderNumber(orderNum);
    } catch (error) {
      throw error;
    }
  }

  async getOrdersByUserId(
    userId: string,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    return await this.orderRepository.findByUserId(userId, options);
  }

  async getOrdersByGuestToken(
    guestToken: string,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    if (!guestToken || guestToken.trim().length === 0) {
      throw new Error("Guest token is required");
    }

    return await this.orderRepository.findByGuestToken(guestToken, options);
  }

  async getOrdersByStatus(
    status: string,
    options?: OrderQueryOptions,
  ): Promise<Order[]> {
    if (!status || status.trim().length === 0) {
      throw new Error("Status is required");
    }

    const orderStatus = OrderStatus.fromString(status);
    return await this.orderRepository.findByStatus(orderStatus, options);
  }

  async getAllOrders(
    options?: OrderQueryOptions & {
      page?: number;
      limit?: number;
      userId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    },
  ): Promise<{ items: Order[]; totalCount: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      userId,
      status,
      startDate,
      endDate,
      search,
    } = options || {};

    const offset = (page - 1) * limit;

    let orders: Order[];
    let totalCount: number;

    const filters: OrderFilterOptions = {};

    if (userId) {
      filters.userId = userId;
    }

    if (status) filters.status = OrderStatus.fromString(status);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;

    const queryOptions: OrderQueryOptions = {
      limit,
      offset,
      sortBy,
      sortOrder,
    };
    // Use filters if any are provided
    if (Object.keys(filters).length > 0) {
      orders = await this.orderRepository.findWithFilters(
        filters,
        queryOptions,
      );
      totalCount = await this.orderRepository.count(filters);
    } else {
      orders = await this.orderRepository.findAll(queryOptions);
      totalCount = await this.orderRepository.count();
    }

    return {
      items: orders,
      totalCount,
    };
  }

  async updateOrderStatus(
    id: string,
    newStatus: string,
  ): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }

    const oldStatus = order.getStatus().getValue();

    const statusValue = newStatus.toLowerCase();

    // Handle specific business logic for certain statuses
    if (statusValue === "paid") {
      order.markAsPaid();
    } else if (statusValue === "fulfilled") {
      order.markAsFulfilled();
    } else if (statusValue === "cancelled") {
      order.cancel();
    } else if (statusValue === "refunded") {
      order.refund();
    } else {
      // For other statuses (confirmed, processing, dispatched, etc.), try generic update
      try {
        const statusObj = OrderStatus.fromString(newStatus);
        order.updateStatus(statusObj);
      } catch (error: any) {
        throw new Error(`Failed to update status: ${error.message}`);
      }
    }

    await this.orderRepository.update(order);

    await this.orderEventService.logOrderStatusChanged(
      id,
      oldStatus,
      order.getStatus().getValue(),
      {
        changedBy: "system",
        timestamp: new Date().toISOString(),
        reason: `Status changed from ${oldStatus} to ${order.getStatus().getValue()}`,
      },
    );

    return order;
  }

  async updateOrderTotals(
    id: string,
    totalsData: {
      tax: number;
      shipping: number;
      discount: number;
    },
  ): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }

    order.updateTotals(
      totalsData.tax,
      totalsData.shipping,
      totalsData.discount,
    );

    await this.orderRepository.update(order);

    return order;
  }

  async markOrderAsPaid(id: string, changedBy?: string): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }

    const oldStatus = order.getStatus().getValue();

    order.markAsPaid();

    const orderItems = order.getItems();
    const defaultLocationId = this.getDefaultWarehouseId();

    for (const item of orderItems) {
      try {
        await this.stockManagementService.reserveStock(
          item.getVariantId(),
          defaultLocationId,
          item.getQuantity(),
        );
      } catch (error) {
        console.error(
          `Failed to reserve stock for item ${item.getOrderItemId()}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    await this.orderRepository.update(order);

    await this.logOrderStatusChange({
      orderId: id,
      fromStatus: oldStatus,
      toStatus: order.getStatus().getValue(),
      changedBy: changedBy || "system",
    });

    return order;
  }

  async markOrderAsFulfilled(
    id: string,
    changedBy?: string,
  ): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }

    const oldStatus = order.getStatus().getValue();

    order.markAsFulfilled();

    const orderItems = order.getItems();
    const shipments = order.getShipments();

    // Determine fulfillment location from shipment data
    // Use the pickupLocationId from the first shipment, or default warehouse
    const fulfillmentLocationId =
      shipments.length > 0 && shipments[0].getPickupLocationId()
        ? shipments[0].getPickupLocationId()!
        : this.getDefaultWarehouseId();

    // Remove stock from inventory for each order item
    for (const item of orderItems) {
      try {
        await this.stockManagementService.adjustStock(
          item.getVariantId(),
          fulfillmentLocationId,
          -item.getQuantity(), // Negative to remove stock
          "order",
          order.getOrderId().getValue(), // Reference the order ID
        );
      } catch (error) {
        // Log error but don't fail the entire fulfillment
        // This allows partial fulfillment if some items have stock issues
        console.error(
          `Failed to adjust inventory for item ${item.getOrderItemId()}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Save order
    await this.orderRepository.update(order);

    // Automatically log status change to history
    await this.logOrderStatusChange({
      orderId: id,
      fromStatus: oldStatus,
      toStatus: order.getStatus().getValue(),
      changedBy: changedBy || "system",
    });

    return order;
  }

  async cancelOrder(id: string): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }

    // If order was paid, we need to release reserved stock
    // Only paid orders would have had stock reserved
    if (order.getStatus().getValue() === "paid") {
      const orderItems = order.getItems();
      const defaultLocationId = this.getDefaultWarehouseId();

      for (const item of orderItems) {
        try {
          // Since releaseReservation was removed, we'll adjust stock positively
          // to compensate for the reserved stock that won't be fulfilled
          await this.stockManagementService.adjustStock(
            item.getVariantId(),
            defaultLocationId,
            item.getQuantity(), // Positive adjustment to release reserved stock
            "adjustment",
            order.getOrderId().getValue(), // Reference the cancelled order ID
          );
        } catch (error) {
          // Log error but don't fail the entire cancellation
          console.error(
            `Failed to release reserved stock for item ${item.getOrderItemId()}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    order.cancel();

    await this.orderRepository.update(order);

    return order;
  }

  async refundOrder(id: string): Promise<Order | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }

    order.refund();

    await this.orderRepository.update(order);

    return order;
  }

  async deleteOrder(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(id);
    if (!order) {
      return false;
    }

    try {
      const orderId = OrderId.fromString(id);
      await this.orderRepository.delete(orderId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("constraint")) {
        throw new Error(
          "Cannot delete order: it has associated items or other dependencies",
        );
      }
      throw error;
    }
  }

  async getOrderCount(filters?: OrderFilterOptions): Promise<number> {
    return await this.orderRepository.count(filters);
  }

  async getOrderCountByStatus(status: string): Promise<number> {
    if (!status || status.trim().length === 0) {
      throw new Error("Status is required");
    }

    const orderStatus = OrderStatus.fromString(status);
    return await this.orderRepository.countByStatus(orderStatus);
  }

  async getOrderCountByUserId(userId: string): Promise<number> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    return await this.orderRepository.countByUserId(userId);
  }

  async orderExists(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const orderId = OrderId.fromString(id);
    return await this.orderRepository.exists(orderId);
  }

  // ============================================================================
  // ORDER ADDRESS MANAGEMENT
  // ============================================================================

  async setOrderAddress(
    orderId: string,
    billingAddressData: {
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
    },
    shippingAddressData: {
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
    },
  ): Promise<OrderAddress> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    // Verify order exists
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only allow setting address for orders in 'created' status
    if (order.getStatus().getValue() !== "created") {
      throw new Error(
        "Cannot set address for order that is not in created status",
      );
    }

    // Create address snapshots
    const billingSnapshot = AddressSnapshot.create(billingAddressData);
    const shippingSnapshot = AddressSnapshot.create(shippingAddressData);

    // Create or update order address
    const existingAddress =
      await this.orderAddressRepository.findByOrderId(orderId);

    if (existingAddress) {
      // Update existing
      existingAddress.updateBillingAddress(billingSnapshot);
      existingAddress.updateShippingAddress(shippingSnapshot);
      await this.orderAddressRepository.update(existingAddress);
    } else {
      // Create new
      const orderAddress = OrderAddress.create({
        orderId,
        billingAddress: billingSnapshot,
        shippingAddress: shippingSnapshot,
      });
      await this.orderAddressRepository.save(orderAddress);
    }

    // Re-fetch from database to ensure we return persisted data
    const savedAddress =
      await this.orderAddressRepository.findByOrderId(orderId);
    if (!savedAddress) {
      throw new Error("Failed to retrieve saved order address");
    }

    return savedAddress;
  }

  async getOrderAddress(orderId: string): Promise<OrderAddress | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderAddressRepository.findByOrderId(orderId);
  }

  async updateBillingAddress(
    orderId: string,
    billingAddressData: {
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
    },
  ): Promise<OrderAddress> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const orderAddress =
      await this.orderAddressRepository.findByOrderId(orderId);
    if (!orderAddress) {
      throw new Error("Order address not found. Please set addresses first.");
    }

    const billingSnapshot = AddressSnapshot.create(billingAddressData);
    orderAddress.updateBillingAddress(billingSnapshot);

    await this.orderAddressRepository.update(orderAddress);

    // Re-fetch from database to ensure we return persisted data
    const updatedAddress =
      await this.orderAddressRepository.findByOrderId(orderId);
    if (!updatedAddress) {
      throw new Error("Failed to retrieve updated order address");
    }

    return updatedAddress;
  }

  async updateShippingAddress(
    orderId: string,
    shippingAddressData: {
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
    },
  ): Promise<OrderAddress> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const orderAddress =
      await this.orderAddressRepository.findByOrderId(orderId);
    if (!orderAddress) {
      throw new Error("Order address not found. Please set addresses first.");
    }

    const shippingSnapshot = AddressSnapshot.create(shippingAddressData);
    orderAddress.updateShippingAddress(shippingSnapshot);

    await this.orderAddressRepository.update(orderAddress);

    // Re-fetch from database to ensure we return persisted data
    const updatedAddress =
      await this.orderAddressRepository.findByOrderId(orderId);
    if (!updatedAddress) {
      throw new Error("Failed to retrieve updated order address");
    }

    return updatedAddress;
  }

  // ============================================================================
  // ORDER ITEM MANAGEMENT
  // ============================================================================

  async addOrderItem(data: {
    orderId: string;
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }): Promise<Order> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Determine location for stock check
    const defaultLocationId = this.getDefaultWarehouseId();

    // Check stock
    const stock = await this.stockManagementService.getStock(
      data.variantId,
      defaultLocationId,
    );
    const available = stock?.getStockLevel().getAvailable() ?? 0;
    if (available < data.quantity) {
      throw new Error(`Insufficient stock for variant ${data.variantId}`);
    }

    // Fetch variant details to build snapshot
    const variant = await this.variantManagementService.getVariantById(
      data.variantId,
    );
    if (!variant) throw new Error("Variant not found");

    const product = await this.productManagementService.getProductById(
      variant.getProductId().getValue(),
    );
    if (!product) throw new Error("Product not found");

    const productSnapshot = ProductSnapshot.create({
      productId: variant.getProductId().getValue(),
      variantId: variant.getId().getValue(),
      sku: variant.getSku().getValue(),
      name: product.getTitle(),
      price: product.getPrice().getValue(),
      imageUrl: undefined, // fetching logic omitted for brevity
      variantName: undefined, // logic omitted
    });

    const orderItem = OrderItem.create({
      orderId: data.orderId,
      variantId: data.variantId,
      quantity: data.quantity,
      productSnapshot,
      isGift: data.isGift ?? false,
      giftMessage: data.giftMessage,
    });

    order.addItem(orderItem);

    await this.orderRepository.update(order);

    // Adjust stock
    await this.stockManagementService.adjustStock(
      data.variantId,
      defaultLocationId,
      -data.quantity,
      "order-add",
      data.orderId,
    );

    return order;
  }

  async updateOrderItem(data: {
    orderId: string;
    itemId: string;
    quantity?: number;
    isGift?: boolean;
    giftMessage?: string;
  }): Promise<Order> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.itemId || data.itemId.trim().length === 0) {
      throw new Error("Item ID is required");
    }

    // Fetch the order
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Get the item from the order
    const items = order.getItems();
    const item = items.find((i) => i.getOrderItemId() === data.itemId);
    if (!item) {
      throw new Error("Order item not found");
    }

    // Update quantity if provided
    if (data.quantity !== undefined) {
      order.updateItemQuantity(data.itemId, data.quantity);
    }

    // Update gift status if provided
    if (data.isGift !== undefined) {
      if (data.isGift) {
        item.setAsGift(data.giftMessage);
      } else {
        item.removeGift();
      }
    } else if (data.giftMessage !== undefined) {
      // If only gift message is provided, set as gift
      item.setAsGift(data.giftMessage);
    }

    // Save the order
    await this.orderRepository.update(order);

    return order;
  }

  async removeOrderItem(data: {
    orderId: string;
    itemId: string;
  }): Promise<Order> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.itemId || data.itemId.trim().length === 0) {
      throw new Error("Item ID is required");
    }

    // Fetch the order
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Remove item from order (this validates business rules)
    order.removeItem(data.itemId);

    // Save the order
    await this.orderRepository.update(order);

    return order;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderItemRepository.findByOrderId(orderId);
  }

  async getOrderItem(itemId: string): Promise<OrderItem | null> {
    if (!itemId || itemId.trim().length === 0) {
      throw new Error("Item ID is required");
    }

    return await this.orderItemRepository.findById(itemId);
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
  }): Promise<OrderShipment> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    // Verify order exists
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Create shipment entity
    const shipment = OrderShipment.create({
      orderId: data.orderId,
      carrier: data.carrier,
      service: data.service,
      trackingNumber: data.trackingNumber,
      giftReceipt: data.giftReceipt ?? false,
      pickupLocationId: data.pickupLocationId,
    });

    // Save shipment
    await this.orderShipmentRepository.save(shipment);

    return shipment;
  }

  async updateShipmentTracking(data: {
    orderId: string;
    shipmentId: string;
    trackingNumber: string;
    carrier?: string;
    service?: string;
  }): Promise<OrderShipment> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.shipmentId || data.shipmentId.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    if (!data.trackingNumber || data.trackingNumber.trim().length === 0) {
      throw new Error("Tracking number is required");
    }

    // Verify order exists
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Get shipment
    const shipment = await this.orderShipmentRepository.findById(
      data.shipmentId,
    );
    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Verify shipment belongs to order
    if (shipment.getOrderId() !== data.orderId) {
      throw new Error("Shipment does not belong to this order");
    }

    // Update tracking number
    shipment.updateTrackingNumber(data.trackingNumber);

    // Update carrier if provided
    if (typeof data.carrier === "string" && data.carrier.trim().length > 0) {
      shipment.updateCarrier(data.carrier);
    }

    // Update service if provided
    if (typeof data.service === "string" && data.service.trim().length > 0) {
      shipment.updateService(data.service);
    }

    // Update shipment in DB
    await this.orderShipmentRepository.update(shipment);

    return shipment;
  }

  async markShipmentShipped(data: {
    orderId: string;
    shipmentId: string;
    carrier: string;
    service: string;
    trackingNumber: string;
  }): Promise<OrderShipment> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.shipmentId || data.shipmentId.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    // Verify order exists
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Get shipment
    const shipment = await this.orderShipmentRepository.findById(
      data.shipmentId,
    );
    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Verify shipment belongs to order
    if (shipment.getOrderId() !== data.orderId) {
      throw new Error("Shipment does not belong to this order");
    }

    // Mark as shipped
    shipment.markAsShipped(data.carrier, data.service, data.trackingNumber);

    // Update shipment
    await this.orderShipmentRepository.update(shipment);

    return shipment;
  }

  async markShipmentDelivered(data: {
    orderId: string;
    shipmentId: string;
    deliveredAt?: Date;
  }): Promise<OrderShipment> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.shipmentId || data.shipmentId.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    // Verify order exists
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Get shipment
    const shipment = await this.orderShipmentRepository.findById(
      data.shipmentId,
    );
    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Verify shipment belongs to order
    if (shipment.getOrderId() !== data.orderId) {
      throw new Error("Shipment does not belong to this order");
    }

    // Mark as delivered
    shipment.markAsDelivered();

    // Update shipment
    await this.orderShipmentRepository.update(shipment);

    return shipment;
  }

  async getOrderShipments(orderId: string): Promise<OrderShipment[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderShipmentRepository.findByOrderId(orderId);
  }

  async getShipment(
    orderId: string,
    shipmentId: string,
  ): Promise<OrderShipment | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!shipmentId || shipmentId.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    const shipment = await this.orderShipmentRepository.findById(shipmentId);

    if (!shipment) {
      return null;
    }

    // Verify shipment belongs to order
    if (shipment.getOrderId() !== orderId) {
      return null;
    }

    return shipment;
  }

  // ============================================================================
  // ORDER STATUS HISTORY MANAGEMENT
  // ============================================================================

  async logOrderStatusChange(data: {
    orderId: string;
    fromStatus?: string;
    toStatus: string;
    changedBy?: string;
  }): Promise<OrderStatusHistory> {
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.toStatus || data.toStatus.trim().length === 0) {
      throw new Error("To status is required");
    }

    // Verify order exists
    const order = await this.getOrderById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Get current status
    const currentStatus = order.getStatus().getValue();

    // If fromStatus not provided, use current status
    const fromStatus = data.fromStatus || currentStatus;

    // Update order status if different from current
    if (currentStatus !== data.toStatus) {
      // Use appropriate domain method based on target status
      const statusValue = data.toStatus.toLowerCase();
      if (statusValue === "paid") {
        order.markAsPaid();
      } else if (statusValue === "fulfilled") {
        order.markAsFulfilled();
      } else if (statusValue === "cancelled") {
        order.cancel();
      } else if (statusValue === "refunded") {
        order.refund();
      } else {
        throw new Error(
          `Cannot set status to ${data.toStatus}. Use specific methods for status transitions.`,
        );
      }

      // Save the updated order
      await this.orderRepository.update(order);
    }

    // Create status history entry
    const statusHistory = OrderStatusHistory.create({
      orderId: data.orderId,
      fromStatus: OrderStatus.fromString(fromStatus),
      toStatus: OrderStatus.fromString(data.toStatus),
      changedBy: data.changedBy,
    });

    // Save status history and get the saved entity with correct historyId
    const savedStatusHistory =
      await this.orderStatusHistoryRepository.save(statusHistory);

    return savedStatusHistory;
  }

  async getOrderStatusHistory(
    orderId: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderStatusHistoryRepository.findByOrderId(
      orderId,
      options,
    );
  }

  async getStatusHistoryById(
    historyId: number,
  ): Promise<OrderStatusHistory | null> {
    return await this.orderStatusHistoryRepository.findById(historyId);
  }

  /**
   * Gets the default warehouse location ID for order fulfillment.
   * Reads from DEFAULT_STOCK_LOCATION environment variable.
   */
  private getDefaultWarehouseId(): string {
    const locationId = process.env.DEFAULT_STOCK_LOCATION;
    if (!locationId) {
      throw new Error(
        "No warehouse location configured. Please set DEFAULT_STOCK_LOCATION in .env.",
      );
    }
    return locationId;
  }
}
