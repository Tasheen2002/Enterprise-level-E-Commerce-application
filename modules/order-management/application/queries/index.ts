// Query interfaces
export type { GetOrderQuery, OrderResult } from "./get-order.query";
export type {
  ListOrdersQuery,
  PaginatedOrdersResult,
} from "./list-orders.query";
export type {
  GetOrderAddressesQuery,
  OrderAddressResult,
} from "./get-order-addresses.query";
export type {
  GetOrderShipmentsQuery,
  ShipmentResult,
} from "./get-order-shipments.query";
export type { GetShipmentQuery } from "./get-shipment.query";
export type {
  GetOrderStatusHistoryQuery,
  StatusHistoryResult,
} from "./get-order-status-history.query";
export type {
  GetOrderEventsQuery,
  OrderEventResult,
} from "./get-order-events.query";
export type { GetOrderEventQuery } from "./get-order-event.query";
export type {
  GetOrderItemQuery,
  OrderItemResult,
} from "./get-order-item.query";
export type { GetOrderItemsQuery } from "./get-order-items.query";
export type { GetBackorderQuery, BackorderResult } from "./get-backorder.query";
export type {
  ListBackordersQuery,
  ListBackordersResult,
} from "./list-backorders.query";
export type { GetPreorderQuery, PreorderResult } from "./get-preorder.query";
export type {
  ListPreordersQuery,
  ListPreordersResult,
} from "./list-preorders.query";

// Query handlers
export { GetOrderHandler } from "./get-order.handler";
export { ListOrdersQueryHandler } from "./list-orders.handler";
export { GetOrderAddressesHandler } from "./get-order-addresses.handler";
export { GetOrderShipmentsHandler } from "./get-order-shipments.handler";
export { GetShipmentHandler } from "./get-shipment.handler";
export { GetOrderStatusHistoryHandler } from "./get-order-status-history.handler";
export { GetOrderEventsHandler } from "./get-order-events.handler";
export { GetOrderEventHandler } from "./get-order-event.handler";
export { GetOrderItemHandler } from "./get-order-item.handler";
export { GetOrderItemsHandler } from "./get-order-items.handler";
export { GetBackorderHandler } from "./get-backorder.handler";
export { ListBackordersHandler } from "./list-backorders.handler";
export { GetPreorderHandler } from "./get-preorder.handler";
export { ListPreordersHandler } from "./list-preorders.handler";
