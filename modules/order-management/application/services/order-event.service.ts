import {
  IOrderEventRepository,
  OrderEventQueryOptions,
} from "../../domain/repositories/order-event.repository";
import { OrderEvent } from "../../domain/entities/order-event.entity";
import { OrderEventTypes } from "../../domain/enums/order-event-types.enum";

export interface LogEventData {
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
}

export class OrderEventService {
  constructor(private readonly orderEventRepository: IOrderEventRepository) {}

  async logEvent(data: LogEventData): Promise<OrderEvent> {
    // Validate required fields
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.eventType || data.eventType.trim().length === 0) {
      throw new Error("Event type is required");
    }

    // Create the order event entity
    const orderEvent = OrderEvent.create({
      orderId: data.orderId,
      eventType: data.eventType,
      payload: data.payload || {},
    });

    // Save the event
    await this.orderEventRepository.save(orderEvent);

    return orderEvent;
  }

  async logOrderCreated(
    orderId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_CREATED,
      payload: payload || {},
    });
  }

  async logOrderUpdated(
    orderId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_UPDATED,
      payload: payload || {},
    });
  }

  async logOrderStatusChanged(
    orderId: string,
    oldStatus: string,
    newStatus: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_STATUS_CHANGED,
      payload: {
        oldStatus,
        newStatus,
        ...payload,
      },
    });
  }

  async logOrderPaid(
    orderId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_PAID,
      payload: payload || {},
    });
  }

  async logOrderFulfilled(
    orderId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_FULFILLED,
      payload: payload || {},
    });
  }

  async logOrderCancelled(
    orderId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_CANCELLED,
      payload: payload || {},
    });
  }

  async logOrderRefunded(
    orderId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_REFUNDED,
      payload: payload || {},
    });
  }

  async logItemAdded(
    orderId: string,
    itemId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_ITEM_ADDED,
      payload: {
        itemId,
        ...payload,
      },
    });
  }

  async logItemRemoved(
    orderId: string,
    itemId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_ITEM_REMOVED,
      payload: {
        itemId,
        ...payload,
      },
    });
  }

  async logItemUpdated(
    orderId: string,
    itemId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_ITEM_UPDATED,
      payload: {
        itemId,
        ...payload,
      },
    });
  }

  async logShipmentCreated(
    orderId: string,
    shipmentId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_SHIPMENT_CREATED,
      payload: {
        shipmentId,
        ...payload,
      },
    });
  }

  async logShipmentShipped(
    orderId: string,
    shipmentId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_SHIPMENT_SHIPPED,
      payload: {
        shipmentId,
        ...payload,
      },
    });
  }

  async logShipmentDelivered(
    orderId: string,
    shipmentId: string,
    payload?: Record<string, any>,
  ): Promise<OrderEvent> {
    return await this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_SHIPMENT_DELIVERED,
      payload: {
        shipmentId,
        ...payload,
      },
    });
  }

  async getEventById(eventId: number): Promise<OrderEvent | null> {
    if (eventId === undefined || eventId === null || eventId < 0) {
      throw new Error("Valid event ID is required");
    }

    return await this.orderEventRepository.findById(eventId);
  }

  async getEventsByOrderId(
    orderId: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderEventRepository.findByOrderId(orderId, options);
  }

  async getEventsByType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    if (!eventType || eventType.trim().length === 0) {
      throw new Error("Event type is required");
    }

    return await this.orderEventRepository.findByEventType(eventType, options);
  }

  async getEventsByOrderAndType(
    orderId: string,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!eventType || eventType.trim().length === 0) {
      throw new Error("Event type is required");
    }

    return await this.orderEventRepository.findByOrderIdAndEventType(
      orderId,
      eventType,
      options,
    );
  }

  async getAllEvents(options?: OrderEventQueryOptions): Promise<OrderEvent[]> {
    return await this.orderEventRepository.findAll(options);
  }

  async getLatestEventForOrder(orderId: string): Promise<OrderEvent | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderEventRepository.getLatestByOrderId(orderId);
  }

  async getOrderEventHistory(
    orderId: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const defaultOptions: OrderEventQueryOptions = {
      sortBy: "createdAt",
      sortOrder: "asc",
      ...options,
    };

    return await this.orderEventRepository.findByOrderId(
      orderId,
      defaultOptions,
    );
  }

  async deleteEvent(eventId: number): Promise<boolean> {
    if (eventId === undefined || eventId === null || eventId < 0) {
      throw new Error("Valid event ID is required");
    }

    const event = await this.getEventById(eventId);
    if (!event) {
      return false;
    }

    await this.orderEventRepository.delete(eventId);
    return true;
  }

  async deleteAllEventsByOrderId(orderId: string): Promise<void> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    await this.orderEventRepository.deleteByOrderId(orderId);
  }

  async getEventCountByOrder(orderId: string): Promise<number> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderEventRepository.countByOrderId(orderId);
  }

  async getEventCountByType(eventType: string): Promise<number> {
    if (!eventType || eventType.trim().length === 0) {
      throw new Error("Event type is required");
    }

    return await this.orderEventRepository.countByEventType(eventType);
  }

  async eventExists(eventId: number): Promise<boolean> {
    if (eventId === undefined || eventId === null || eventId < 0) {
      throw new Error("Valid event ID is required");
    }

    return await this.orderEventRepository.exists(eventId);
  }
}
