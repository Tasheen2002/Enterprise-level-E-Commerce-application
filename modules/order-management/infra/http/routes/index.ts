import { FastifyInstance } from "fastify";
import { OrderController } from "../controllers/order.controller";
import { OrderAddressController } from "../controllers/order-address.controller";
import { OrderItemController } from "../controllers/order-item.controller";
import { OrderShipmentController } from "../controllers/order-shipment.controller";
import { OrderStatusHistoryController } from "../controllers/order-status-history.controller";
import { OrderEventController } from "../controllers/order-event.controller";
import { PreorderController } from "../controllers/preorder.controller";
import { BackorderController } from "../controllers/backorder.controller";
import {
  OrderManagementService,
  OrderItemManagementService,
  ShipmentManagementService,
  OrderEventService,
  PreorderManagementService,
  BackorderManagementService,
  // Order commands
  CreateOrderHandler,
  UpdateOrderStatusHandler,
  UpdateOrderTotalsHandler,
  MarkOrderPaidHandler,
  MarkOrderFulfilledHandler,
  CancelOrderHandler,
  DeleteOrderHandler,
  // Order queries
  GetOrderHandler,
  ListOrdersHandler,
  TrackOrderHandler,
  // Address commands
  SetOrderAddressesHandler,
  UpdateBillingAddressHandler,
  UpdateShippingAddressHandler,
  // Address queries
  GetOrderAddressHandler,
  // Order item commands
  AddOrderItemHandler,
  UpdateOrderItemHandler,
  RemoveOrderItemHandler,
  // Order item queries
  ListOrderItemsHandler,
  GetOrderItemHandler,
  // Shipment commands
  CreateShipmentHandler,
  UpdateShipmentTrackingHandler,
  MarkShipmentShippedHandler,
  MarkShipmentDeliveredHandler,
  // Shipment queries
  ListOrderShipmentsHandler,
  GetShipmentHandler,
  // Status history
  LogOrderStatusChangeHandler,
  GetOrderStatusHistoryHandler,
  // Events
  LogOrderEventHandler,
  ListOrderEventsHandler,
  GetOrderEventHandler,
  // Preorders
  CreatePreorderHandler,
  UpdatePreorderReleaseDateHandler,
  MarkPreorderNotifiedHandler,
  DeletePreorderHandler,
  GetPreorderHandler,
  ListPreordersHandler,
  // Backorders
  CreateBackorderHandler,
  UpdateBackorderEtaHandler,
  MarkBackorderNotifiedHandler,
  DeleteBackorderHandler,
  GetBackorderHandler,
  ListBackordersHandler,
} from "../../../application";
import { registerOrderRoutes } from "./order.routes";
import { registerOrderAddressRoutes } from "./order-address.routes";
import { registerOrderItemRoutes } from "./order-item.routes";
import { registerOrderShipmentRoutes } from "./order-shipment.routes";
import { registerOrderStatusHistoryRoutes } from "./order-status-history.routes";
import { registerOrderEventRoutes } from "./order-event.routes";
import { registerPreorderRoutes } from "./preorder.routes";
import { registerBackorderRoutes } from "./backorder.routes";

export interface OrderManagementRouteServices {
  orderService: OrderManagementService;
  orderItemService: OrderItemManagementService;
  shipmentService: ShipmentManagementService;
  orderEventService: OrderEventService;
  preorderService: PreorderManagementService;
  backorderService: BackorderManagementService;
}

export async function registerOrderManagementRoutes(
  fastify: FastifyInstance,
  services: OrderManagementRouteServices,
): Promise<void> {
  const { orderService, orderItemService, shipmentService, orderEventService, preorderService, backorderService } = services;

  const orderController = new OrderController(
    new CreateOrderHandler(orderService),
    new GetOrderHandler(orderService),
    new ListOrdersHandler(orderService),
    new UpdateOrderStatusHandler(orderService),
    new UpdateOrderTotalsHandler(orderService),
    new MarkOrderPaidHandler(orderService),
    new MarkOrderFulfilledHandler(orderService),
    new CancelOrderHandler(orderService),
    new DeleteOrderHandler(orderService),
    new TrackOrderHandler(orderService, shipmentService),
  );

  const orderAddressController = new OrderAddressController(
    new SetOrderAddressesHandler(orderService),
    new UpdateBillingAddressHandler(orderService),
    new UpdateShippingAddressHandler(orderService),
    new GetOrderAddressHandler(orderService),
  );

  const orderItemController = new OrderItemController(
    new AddOrderItemHandler(orderService),
    new UpdateOrderItemHandler(orderService),
    new RemoveOrderItemHandler(orderService),
    new ListOrderItemsHandler(orderItemService),
    new GetOrderItemHandler(orderItemService),
  );

  const orderShipmentController = new OrderShipmentController(
    new CreateShipmentHandler(orderService),
    new UpdateShipmentTrackingHandler(orderService),
    new MarkShipmentShippedHandler(orderService),
    new MarkShipmentDeliveredHandler(orderService),
    new ListOrderShipmentsHandler(shipmentService),
    new GetShipmentHandler(shipmentService),
  );

  const orderStatusHistoryController = new OrderStatusHistoryController(
    new LogOrderStatusChangeHandler(orderService),
    new GetOrderStatusHistoryHandler(orderService),
  );

  const orderEventController = new OrderEventController(
    new LogOrderEventHandler(orderEventService),
    new ListOrderEventsHandler(orderEventService),
    new GetOrderEventHandler(orderEventService),
  );

  const preorderController = new PreorderController(
    new CreatePreorderHandler(preorderService),
    new UpdatePreorderReleaseDateHandler(preorderService),
    new MarkPreorderNotifiedHandler(preorderService),
    new DeletePreorderHandler(preorderService),
    new GetPreorderHandler(preorderService),
    new ListPreordersHandler(preorderService),
  );

  const backorderController = new BackorderController(
    new CreateBackorderHandler(backorderService),
    new UpdateBackorderEtaHandler(backorderService),
    new MarkBackorderNotifiedHandler(backorderService),
    new DeleteBackorderHandler(backorderService),
    new GetBackorderHandler(backorderService),
    new ListBackordersHandler(backorderService),
  );

  await fastify.register(
    async (instance) => {
      await registerOrderRoutes(instance, orderController);
      await registerOrderAddressRoutes(instance, orderAddressController);
      await registerOrderItemRoutes(instance, orderItemController);
      await registerOrderShipmentRoutes(instance, orderShipmentController);
      await registerOrderStatusHistoryRoutes(instance, orderStatusHistoryController);
      await registerOrderEventRoutes(instance, orderEventController);
      await registerPreorderRoutes(instance, preorderController);
      await registerBackorderRoutes(instance, backorderController);
    },
    { prefix: "/api/v1" },
  );
}
