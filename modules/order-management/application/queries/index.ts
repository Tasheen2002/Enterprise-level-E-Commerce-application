// Query interfaces
export type { GetOrderQuery, OrderResult } from "./get-order/get-order.query";
export type {
  ListOrdersQuery,
  PaginatedOrdersResult,
} from "./list-orders/list-orders.query";
export type {
  GetOrderAddressesQuery,
  OrderAddressResult,
} from "./get-order-addresses/get-order-addresses.query";
export type {
  GetOrderShipmentsQuery,
  ShipmentResult,
} from "./get-order-shipments/get-order-shipments.query";
export type { GetShipmentQuery } from "./get-shipment/get-shipment.query";
export type {
  GetOrderStatusHistoryQuery,
  StatusHistoryResult,
} from "./get-order-status-history/get-order-status-history.query";
export type {
  GetOrderEventsQuery,
  OrderEventResult,
} from "./get-order-events/get-order-events.query";
export type { GetOrderEventQuery } from "./get-order-event/get-order-event.query";
export type {
  GetOrderItemQuery,
  OrderItemResult,
} from "./get-order-item/get-order-item.query";
export type { GetOrderItemsQuery } from "./get-order-items/get-order-items.query";
export type { GetBackorderQuery, BackorderResult } from "./get-backorder/get-backorder.query";
export type {
  ListBackordersQuery,
  ListBackordersResult,
} from "./list-backorders/list-backorders.query";
export type { GetPreorderQuery, PreorderResult } from "./get-preorder/get-preorder.query";
export type {
  ListPreordersQuery,
  ListPreordersResult,
} from "./list-preorders/list-preorders.query";

// Query handlers
export { GetOrderHandler } from "./get-order/get-order.handler";
export { ListOrdersQueryHandler } from "./list-orders/list-orders.handler";
export { GetOrderAddressesHandler } from "./get-order-addresses/get-order-addresses.handler";
export { GetOrderShipmentsHandler } from "./get-order-shipments/get-order-shipments.handler";
export { GetShipmentHandler } from "./get-shipment/get-shipment.handler";
export { GetOrderStatusHistoryHandler } from "./get-order-status-history/get-order-status-history.handler";
export { GetOrderEventsHandler } from "./get-order-events/get-order-events.handler";
export { GetOrderEventHandler } from "./get-order-event/get-order-event.handler";
export { GetOrderItemHandler } from "./get-order-item/get-order-item.handler";
export { GetOrderItemsHandler } from "./get-order-items/get-order-items.handler";
export { GetBackorderHandler } from "./get-backorder/get-backorder.handler";
export { ListBackordersHandler } from "./list-backorders/list-backorders.handler";
export { GetPreorderHandler } from "./get-preorder/get-preorder.handler";
export { ListPreordersHandler } from "./list-preorders/list-preorders.handler";
