// Command interfaces
export type { CreateOrderCommand } from "./create-order/create-order.command";
export type { UpdateOrderStatusCommand } from "./update-order-status/update-order-status.command";
export type { UpdateOrderTotalsCommand } from "./update-order-totals/update-order-totals.command";
export type { CancelOrderCommand } from "./cancel-order/cancel-order.command";
export type { MarkOrderAsPaidCommand } from "./mark-order-paid/mark-order-paid.command";
export type { MarkOrderAsFulfilledCommand } from "./mark-order-fulfilled/mark-order-fulfilled.command";
export type { DeleteOrderCommand } from "./delete-order/delete-order.command";
export type { AddOrderItemCommand } from "./add-order-item/add-order-item.command";
export type { UpdateOrderItemCommand } from "./update-order-item/update-order-item.command";
export type { RemoveOrderItemCommand } from "./remove-order-item/remove-order-item.command";
export type { SetOrderAddressesCommand } from "./set-order-addresses/set-order-addresses.command";
export type { UpdateBillingAddressCommand } from "./update-billing-address/update-billing-address.command";
export type { UpdateShippingAddressCommand } from "./update-shipping-address/update-shipping-address.command";
export type { CreateShipmentCommand } from "./create-shipment/create-shipment.command";
export type { UpdateShipmentTrackingCommand } from "./update-shipment-tracking/update-shipment-tracking.command";
export type { MarkShipmentShippedCommand } from "./mark-shipment-shipped/mark-shipment-shipped.command";
export type { MarkShipmentDeliveredCommand } from "./mark-shipment-delivered/mark-shipment-delivered.command";
export type { CreateBackorderCommand } from "./create-backorder/create-backorder.command";
export type { UpdateBackorderEtaCommand } from "./update-backorder-eta/update-backorder-eta.command";
export type { MarkBackorderNotifiedCommand } from "./mark-backorder-notified/mark-backorder-notified.command";
export type { DeleteBackorderCommand } from "./delete-backorder/delete-backorder.command";
export type { CreatePreorderCommand } from "./create-preorder/create-preorder.command";
export type { UpdatePreorderReleaseDateCommand } from "./update-preorder-release-date/update-preorder-release-date.command";
export type { MarkPreorderNotifiedCommand } from "./mark-preorder-notified/mark-preorder-notified.command";
export type { DeletePreorderCommand } from "./delete-preorder/delete-preorder.command";
export type { LogOrderEventCommand } from "./log-order-event/log-order-event.command";
export type { LogOrderStatusChangeCommand } from "./log-order-status-change/log-order-status-change.command";

// Command handlers
export {
  CreateOrderCommandHandler,
  CreateOrderCommandHandler as CreateOrderHandler,
} from "./create-order/create-order.handler";
export { UpdateOrderStatusCommandHandler } from "./update-order-status/update-order-status.handler";
export { UpdateOrderTotalsCommandHandler } from "./update-order-totals/update-order-totals.handler";
export { CancelOrderCommandHandler } from "./cancel-order/cancel-order.handler";
export { MarkOrderAsPaidCommandHandler } from "./mark-order-paid/mark-order-paid.handler";
export { MarkOrderAsFulfilledCommandHandler } from "./mark-order-fulfilled/mark-order-fulfilled.handler";
export { DeleteOrderCommandHandler } from "./delete-order/delete-order.handler";
export { AddOrderItemCommandHandler } from "./add-order-item/add-order-item.handler";
export { UpdateOrderItemCommandHandler } from "./update-order-item/update-order-item.handler";
export { RemoveOrderItemCommandHandler } from "./remove-order-item/remove-order-item.handler";
export { SetOrderAddressesCommandHandler } from "./set-order-addresses/set-order-addresses.handler";
export { UpdateBillingAddressCommandHandler } from "./update-billing-address/update-billing-address.handler";
export { UpdateShippingAddressCommandHandler } from "./update-shipping-address/update-shipping-address.handler";
export { CreateShipmentCommandHandler } from "./create-shipment/create-shipment.handler";
export { UpdateShipmentTrackingCommandHandler } from "./update-shipment-tracking/update-shipment-tracking.handler";
export { MarkShipmentShippedCommandHandler } from "./mark-shipment-shipped/mark-shipment-shipped.handler";
export { MarkShipmentDeliveredCommandHandler } from "./mark-shipment-delivered/mark-shipment-delivered.handler";
export { CreateBackorderCommandHandler } from "./create-backorder/create-backorder.handler";
export { UpdateBackorderEtaCommandHandler } from "./update-backorder-eta/update-backorder-eta.handler";
export { MarkBackorderNotifiedCommandHandler } from "./mark-backorder-notified/mark-backorder-notified.handler";
export { DeleteBackorderCommandHandler } from "./delete-backorder/delete-backorder.handler";
export { CreatePreorderCommandHandler } from "./create-preorder/create-preorder.handler";
export { UpdatePreorderReleaseDateCommandHandler } from "./update-preorder-release-date/update-preorder-release-date.handler";
export { MarkPreorderNotifiedCommandHandler } from "./mark-preorder-notified/mark-preorder-notified.handler";
export { DeletePreorderCommandHandler } from "./delete-preorder/delete-preorder.handler";
export { LogOrderEventCommandHandler } from "./log-order-event/log-order-event.handler";
export { LogOrderStatusChangeCommandHandler } from "./log-order-status-change/log-order-status-change.handler";
