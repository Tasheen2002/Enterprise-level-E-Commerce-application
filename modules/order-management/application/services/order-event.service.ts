import {
  IOrderEventRepository,
  OrderEventQueryOptions,
} from "../../domain/repositories/order-event.repository";
import { OrderEvent, OrderEventDTO, OrderEventTypes } from "../../domain/entities/order-event.entity";
import { OrderEventNotFoundError } from "../../domain/errors/order-management.errors";
import { OrderId } from "../../domain/value-objects/order-id.vo";

interface LogEventParams {
  orderId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  loggedBy?: string;
}

export class OrderEventService {
  constructor(private readonly orderEventRepository: IOrderEventRepository) { }

  async logEvent(params: LogEventParams): Promise<OrderEventDTO> {
    const orderEvent = OrderEvent.create({
      orderId: OrderId.fromString(params.orderId).getValue(),
      eventType: params.eventType,
      payload: params.payload ?? {},
      loggedBy: params.loggedBy,
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
      payload,
    });
  }

  async logOrderUpdated(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_UPDATED,
      payload,
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
      payload: { ...payload, oldStatus, newStatus },
    });
  }

  async logOrderPaid(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_PAID,
      payload,
    });
  }

  async logOrderFulfilled(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_FULFILLED,
      payload,
    });
  }

  async logOrderCancelled(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_CANCELLED,
      payload,
    });
  }

  async logOrderRefunded(
    orderId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrderEventDTO> {
    return this.logEvent({
      orderId,
      eventType: OrderEventTypes.ORDER_REFUNDED,
      payload,
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
      payload: { ...payload, itemId },
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
      payload: { ...payload, itemId },
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
      payload: { ...payload, itemId },
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
      payload: { ...payload, shipmentId },
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
      payload: { ...payload, shipmentId },
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
      payload: { ...payload, shipmentId },
    });
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async getEventById(eventId: number): Promise<OrderEventDTO | null> {
    const event = await this.orderEventRepository.findById(eventId);
    return event ? OrderEvent.toDTO(event) : null;
  }

  async getEventsByOrderId(
    orderId: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEventDTO[]> {
    const events = await this.orderEventRepository.findByOrderId(
      OrderId.fromString(orderId),
      options,
    );
    return events.map((e) => OrderEvent.toDTO(e));
  }

  async getEventsByType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEventDTO[]> {
    const events = await this.orderEventRepository.findByEventType(eventType, options);
    return events.map((e) => OrderEvent.toDTO(e));
  }

  async getEventsByOrderAndType(
    orderId: string,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEventDTO[]> {
    const events = await this.orderEventRepository.findByOrderIdAndEventType(
      OrderId.fromString(orderId),
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
    const event = await this.orderEventRepository.getLatestByOrderId(
      OrderId.fromString(orderId),
    );
    return event ? OrderEvent.toDTO(event) : null;
  }

  // ─── Deletes ───────────────────────────────────────────────────────────────

  async deleteEvent(eventId: number): Promise<void> {
    const exists = await this.orderEventRepository.exists(eventId);
    if (!exists) throw new OrderEventNotFoundError(String(eventId));

    await this.orderEventRepository.delete(eventId);
  }

  async deleteAllEventsByOrderId(orderId: string): Promise<void> {
    await this.orderEventRepository.deleteByOrderId(
      OrderId.fromString(orderId),
    );
  }

  // ─── Counters / existence ─────────────────────────────────────────────────

  async getEventCountByOrder(orderId: string): Promise<number> {
    return this.orderEventRepository.countByOrderId(
      OrderId.fromString(orderId),
    );
  }

  async getEventCountByType(eventType: string): Promise<number> {
    return this.orderEventRepository.countByEventType(eventType);
  }

  async eventExists(eventId: number): Promise<boolean> {
    return this.orderEventRepository.exists(eventId);
  }
}
