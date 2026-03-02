export enum OrderEventTypes {
  // Order lifecycle events
  ORDER_CREATED = "order.created",
  ORDER_UPDATED = "order.updated",
  ORDER_CANCELLED = "order.cancelled",
  ORDER_REFUNDED = "order.refunded",

  // Status change events
  ORDER_STATUS_CHANGED = "order.status_changed",
  ORDER_PAID = "order.paid",
  ORDER_FULFILLED = "order.fulfilled",

  // Item events
  ORDER_ITEM_ADDED = "order.item_added",
  ORDER_ITEM_REMOVED = "order.item_removed",
  ORDER_ITEM_UPDATED = "order.item_updated",

  // Shipment events
  ORDER_SHIPMENT_CREATED = "order.shipment_created",
  ORDER_SHIPMENT_SHIPPED = "order.shipment_shipped",
  ORDER_SHIPMENT_DELIVERED = "order.shipment_delivered",

  // Payment events
  PAYMENT_RECEIVED = "payment.received",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",

  // System events
  ORDER_SYSTEM_NOTE = "order.system_note",
  ORDER_ADMIN_ACTION = "order.admin_action",
}

export const ORDER_EVENT_DESCRIPTIONS: Record<OrderEventTypes, string> = {
  [OrderEventTypes.ORDER_CREATED]: "Order was created",
  [OrderEventTypes.ORDER_UPDATED]: "Order details were updated",
  [OrderEventTypes.ORDER_CANCELLED]: "Order was cancelled",
  [OrderEventTypes.ORDER_REFUNDED]: "Order was refunded",
  [OrderEventTypes.ORDER_STATUS_CHANGED]: "Order status was changed",
  [OrderEventTypes.ORDER_PAID]: "Order payment was processed",
  [OrderEventTypes.ORDER_FULFILLED]: "Order was fulfilled",
  [OrderEventTypes.ORDER_ITEM_ADDED]: "Item was added to order",
  [OrderEventTypes.ORDER_ITEM_REMOVED]: "Item was removed from order",
  [OrderEventTypes.ORDER_ITEM_UPDATED]: "Order item was updated",
  [OrderEventTypes.ORDER_SHIPMENT_CREATED]: "Shipment was created",
  [OrderEventTypes.ORDER_SHIPMENT_SHIPPED]: "Shipment was shipped",
  [OrderEventTypes.ORDER_SHIPMENT_DELIVERED]: "Shipment was delivered",
  [OrderEventTypes.PAYMENT_RECEIVED]: "Payment was received",
  [OrderEventTypes.PAYMENT_FAILED]: "Payment failed",
  [OrderEventTypes.PAYMENT_REFUNDED]: "Payment was refunded",
  [OrderEventTypes.ORDER_SYSTEM_NOTE]: "System note added",
  [OrderEventTypes.ORDER_ADMIN_ACTION]: "Admin action performed",
};
