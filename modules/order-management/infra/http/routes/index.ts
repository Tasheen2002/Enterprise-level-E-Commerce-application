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
  UpdateOrderStatusCommandHandler,
  UpdateOrderTotalsCommandHandler,
  MarkOrderPaidCommandHandler,
  MarkOrderFulfilledCommandHandler,
  CancelOrderCommandHandler,
  DeleteOrderCommandHandler,
  // Order queries
  GetOrderHandler,
  ListOrdersHandler,
  TrackOrderHandler,
  // Address commands
  SetOrderAddressesCommandHandler,
  UpdateBillingAddressCommandHandler,
  UpdateShippingAddressCommandHandler,
  // Address queries
  GetOrderAddressHandler,
  // Order item commands
  AddOrderItemCommandHandler,
  UpdateOrderItemCommandHandler,
  RemoveOrderItemCommandHandler,
  // Order item queries
  ListOrderItemsHandler,
  GetOrderItemHandler,
  // Shipment commands
  CreateShipmentCommandHandler,
  UpdateShipmentTrackingCommandHandler,
  MarkShipmentShippedCommandHandler,
  MarkShipmentDeliveredCommandHandler,
  // Shipment queries
  ListOrderShipmentsHandler,
  GetShipmentHandler,
  // Status history
  LogOrderStatusChangeCommandHandler,
  GetOrderStatusHistoryHandler,
  // Events
  LogOrderEventCommandHandler,
  ListOrderEventsHandler,
  GetOrderEventHandler,
  // Preorders
  CreatePreorderCommandHandler,
  UpdatePreorderReleaseDateCommandHandler,
  MarkPreorderNotifiedCommandHandler,
  DeletePreorderCommandHandler,
  GetPreorderHandler,
  ListPreordersHandler,
  // Backorders
  CreateBackorderCommandHandler,
  UpdateBackorderEtaCommandHandler,
  MarkBackorderNotifiedCommandHandler,
  DeleteBackorderCommandHandler,
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
    new UpdateOrderStatusCommandHandler(orderService),
    new UpdateOrderTotalsCommandHandler(orderService),
    new MarkOrderPaidCommandHandler(orderService),
    new MarkOrderFulfilledCommandHandler(orderService),
    new CancelOrderCommandHandler(orderService),
    new DeleteOrderCommandHandler(orderService),
    new TrackOrderHandler(orderService, shipmentService),
  );

  const orderAddressController = new OrderAddressController(
    new SetOrderAddressesCommandHandler(orderService),
    new UpdateBillingAddressCommandHandler(orderService),
    new UpdateShippingAddressCommandHandler(orderService),
    new GetOrderAddressHandler(orderService),
  );

  const orderItemController = new OrderItemController(
    new AddOrderItemCommandHandler(orderService),
    new UpdateOrderItemCommandHandler(orderService),
    new RemoveOrderItemCommandHandler(orderService),
    new ListOrderItemsHandler(orderItemService),
    new GetOrderItemHandler(orderItemService),
  );

  const orderShipmentController = new OrderShipmentController(
    new CreateShipmentCommandHandler(orderService),
    new UpdateShipmentTrackingCommandHandler(orderService),
    new MarkShipmentShippedCommandHandler(orderService),
    new MarkShipmentDeliveredCommandHandler(orderService),
    new ListOrderShipmentsHandler(shipmentService),
    new GetShipmentHandler(shipmentService),
  );

  const orderStatusHistoryController = new OrderStatusHistoryController(
    new LogOrderStatusChangeCommandHandler(orderService),
    new GetOrderStatusHistoryHandler(orderService),
  );

  const orderEventController = new OrderEventController(
    new LogOrderEventCommandHandler(orderEventService),
    new ListOrderEventsHandler(orderEventService),
    new GetOrderEventHandler(orderEventService),
  );

  const preorderController = new PreorderController(
    new CreatePreorderCommandHandler(preorderService),
    new UpdatePreorderReleaseDateCommandHandler(preorderService),
    new MarkPreorderNotifiedCommandHandler(preorderService),
    new DeletePreorderCommandHandler(preorderService),
    new GetPreorderHandler(preorderService),
    new ListPreordersHandler(preorderService),
  );

  const backorderController = new BackorderController(
    new CreateBackorderCommandHandler(backorderService),
    new UpdateBackorderEtaCommandHandler(backorderService),
    new MarkBackorderNotifiedCommandHandler(backorderService),
    new DeleteBackorderCommandHandler(backorderService),
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
