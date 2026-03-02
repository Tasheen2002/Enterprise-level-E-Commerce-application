import { FastifyInstance } from "fastify";
import { OrderController } from "../controllers/order.controller";
import { OrderAddressController } from "../controllers/order-address.controller";
import { OrderItemController } from "../controllers/order-item.controller";
import { OrderShipmentController } from "../controllers/order-shipment.controller";
import { OrderStatusHistoryController } from "../controllers/order-status-history.controller";
import { OrderEventController } from "../controllers/order-event.controller";
import { PreorderController } from "../controllers/preorder.controller";
import { BackorderController } from "../controllers/backorder.controller";
import { OrderManagementService } from "../../../application/services/order-management.service";
import { OrderEventService } from "../../../application/services/order-event.service";
import { PreorderManagementService } from "../../../application/services/preorder-management.service";
import { BackorderManagementService } from "../../../application/services/backorder-management.service";
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
  orderEventService: OrderEventService;
  preorderService: PreorderManagementService;
  backorderService: BackorderManagementService;
}

export async function registerOrderManagementRoutes(
  fastify: FastifyInstance,
  services: OrderManagementRouteServices,
): Promise<void> {
  const orderController = new OrderController(services.orderService);
  const orderAddressController = new OrderAddressController(services.orderService);
  const orderItemController = new OrderItemController(services.orderService);
  const orderShipmentController = new OrderShipmentController(services.orderService);
  const orderStatusHistoryController = new OrderStatusHistoryController(services.orderService);
  const orderEventController = new OrderEventController(services.orderEventService);
  const preorderController = new PreorderController(services.preorderService);
  const backorderController = new BackorderController(services.backorderService);

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
