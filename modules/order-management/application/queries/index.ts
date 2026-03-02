// Order Queries
export { GetOrderQuery, GetOrderHandler, OrderResult } from "./get-order.query";
export {
  GetOrderByNumberQuery,
  GetOrderByNumberQueryHandler,
} from "./get-order-by-number.query";
export {
  ListOrdersQuery,
  ListOrdersQueryHandler,
  PaginatedOrdersResult,
} from "./list-orders.query";
export {
  GetOrderAddressesQuery,
  GetOrderAddressesHandler,
  OrderAddressResult,
} from "./get-order-addresses.query";

// Order Shipment Queries
export {
  GetOrderShipmentsQuery,
  GetOrderShipmentsHandler,
} from "./get-order-shipments.query";
export { GetShipmentQuery, GetShipmentHandler } from "./get-shipment.query";

// Order Status History Queries
export {
  GetOrderStatusHistoryQuery,
  GetOrderStatusHistoryHandler,
} from "./get-order-status-history.query";

// Order Events Queries
export {
  GetOrderEventsQuery,
  GetOrderEventsHandler,
} from "./get-order-events.query";
export {
  GetOrderEventQuery,
  GetOrderEventHandler,
} from "./get-order-event.query";

// Order Items Queries
export { GetOrderItemQuery, GetOrderItemHandler } from "./get-order-item.query";
export {
  GetOrderItemsQuery,
  GetOrderItemsHandler,
} from "./get-order-items.query";

// Backorder Queries
export {
  GetBackorderQuery,
  GetBackorderHandler,
  BackorderResult,
} from "./get-backorder.query";
export {
  ListBackordersQuery,
  ListBackordersHandler,
  ListBackordersResult,
} from "./list-backorders.query";

// Preorder Queries
export {
  GetPreorderQuery,
  GetPreorderHandler,
  PreorderResult,
} from "./get-preorder.query";
export {
  ListPreordersQuery,
  ListPreordersHandler,
  ListPreordersResult,
} from "./list-preorders.query";
