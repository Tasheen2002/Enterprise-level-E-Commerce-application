import {
  IOrderEventRepository,
  OrderEventQueryOptions,
} from "../../domain/repositories/order-event.repository";
import { OrderEvent, OrderEventDTO } from "../../domain/entities/order-event.entity";
import {
  OrderEventNotFoundError,
  DomainValidationError,
} from "../../domain/errors/order-management.errors";

export enum OrderEventTypes {
  ORDER_CREATED = "order.created",
  ORDER_UPDATED = "order.updated",
  ORDER_CANCELLED = "order.cancelled",
  ORDER_REFUNDED = "order.refunded",
  ORDER_STATUS_CHANGED = "order.status_changed",
  ORDER_PAID = "order.paid",
  ORDER_FULFILLED = "order.fulfilled",
  ORDER_ITEM_ADDED = "order.item_added",
  ORDER_ITEM_REMOVED = "order.item_removed",
  ORDER_ITEM_UPDATED = "order.item_updated",
  ORDER_SHIPMENT_CREATED = "order.shipment_created",
  ORDER_SHIPMENT_SHIPPED = "order.shipment_shipped",
  ORDER_SHIPMENT_DELIVERED = "order.shipment_delivered",
  PAYMENT_RECEIVED = "payment.received",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",
  ORDER_SYSTEM_NOTE = "order.system_note",
  ORDER_ADMIN_ACTION = "order.admin_action",
}

interface LogEventParams {
  orderId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export class OrderEventService {
  constructor(private readonly orderEventRepository: IOrderEventRepository) {}

  async logEvent(params: LogEventParams): Promise<OrderEventDTO> {
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    if (!params.eventType || params.eventType.trim().length === 0) {
      throw new DomainValidationError("Event type is required");
    }

    const orderEvent = OrderEvent.create({
      orderId: params.orderId,
      eventType: params.eventType,
      payload: params.payload || {},
    });

    await this.orderEventRepository.save(orderEvent);

    return OrderEvent.toDTO(orderEvent);
  }

  async logOrderCreated(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_CREATED,
      payload: payload || {},
    });
  }

  async logOrderUpdated(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_UPDATED,
      payload: payload || {},
    });
  }

  async logOrderStatusChanged(
    orderId: string,
    oldStatus: string,
    newStatus: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
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
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_PAID,
      payload: payload || {},
    });
  }

  async logOrderFulfilled(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_FULFILLED,
      payload: payload || {},
    });
  }

  async logOrderCancelled(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_CANCELLED,
      payload: payload || {},
    });
  }

  async logOrderRefunded(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_REFUNDED,
      payload: payload || {},
    });
  }

  async logItemAdded(
    orderId: string,
    itemId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
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
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
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
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
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
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
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
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
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
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_SHIPMENT_DELIVERED,
      payload: {
        shipmentId,
        ...payload,
      },
    });
  }

  async getEventById(eventId: number): Promise<OrderEventDTO | null> {
    if (eventId === undefined || eventId === null || eventId < 0) {
      throw new DomainValidationError("Valid event ID is required");
    }

    const event = await this.orderEventRepository.findById(eventId);
    return event ? OrderEvent.toDTO(event) : null;
  }

  async getEventsByOrderId(
    orderId: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEventDTO[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    const events = await this.orderEventRepository.findByOrderId(orderId, options);
    return events.map((e) => OrderEvent.toDTO(e));
  }

  async getEventsByType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEventDTO[]> {
    if (!eventType || eventType.trim().length === 0) {
      throw new DomainValidationError("Event type is required");
    }

    const events = await this.orderEventRepository.findByEventType(eventType, options);
    return events.map((e) => OrderEvent.toDTO(e));
  }

  async getEventsByOrderAndType(
    orderId: string,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEventDTO[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    if (!eventType || eventType.trim().length === 0) {
      throw new DomainValidationError("Event type is required");
    }

    const events = await this.orderEventRepository.findByOrderIdAndEventType(
      orderId,
      eventType,
      options,
    );
    return events.map((e) => OrderEvent.toDTO(e));
  }

  async getAllEvents(options?: OrderEventQueryOptions): Promise<OrderEventDTO[]> {
    const events = await this.orderEventRepository.findAll(options);
    return events.map((e) => OrderEvent.toDTO(e));
  }

  async getLatestEventForOrder(orderId: string): Promise<OrderEventDTO | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    const event = await this.orderEventRepository.getLatestByOrderId(orderId);
    return event ? OrderEvent.toDTO(event) : null;
  }

  async deleteEvent(eventId: number): Promise<void> {
    if (eventId === undefined || eventId === null || eventId < 0) {
      throw new DomainValidationError("Valid event ID is required");
    }

    const exists = await this.orderEventRepository.exists(eventId);
    if (!exists) throw new OrderEventNotFoundError(eventId.toString());

    await this.orderEventRepository.delete(eventId);
  }

  async deleteAllEventsByOrderId(orderId: string): Promise<void> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    await this.orderEventRepository.deleteByOrderId(orderId);
  }

  async getEventCountByOrder(orderId: string): Promise<number> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    return this.orderEventRepository.countByOrderId(orderId);
  }

  async getEventCountByType(eventType: string): Promise<number> {
    if (!eventType || eventType.trim().length === 0) {
      throw new DomainValidationError("Event type is required");
    }

    return this.orderEventRepository.countByEventType(eventType);
  }

  async eventExists(eventId: number): Promise<boolean> {
    if (eventId === undefined || eventId === null || eventId < 0) {
      throw new DomainValidationError("Valid event ID is required");
    }

    return this.orderEventRepository.exists(eventId);
  }
}
