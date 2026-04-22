import { FastifyInstance } from "fastify";
import {
  OrderController,
  OrderAddressController,
  OrderItemController,
  OrderShipmentController,
  OrderStatusHistoryController,
  OrderEventController,
  PreorderController,
  BackorderController,
} from "../controllers";
import { registerOrderRoutes } from "./order.routes";
import { registerOrderAddressRoutes } from "./order-address.routes";
import { registerOrderItemRoutes } from "./order-item.routes";
import { registerOrderShipmentRoutes } from "./order-shipment.routes";
import { registerOrderStatusHistoryRoutes } from "./order-status-history.routes";
import { registerOrderEventRoutes } from "./order-event.routes";
import { registerPreorderRoutes } from "./preorder.routes";
import { registerBackorderRoutes } from "./backorder.routes";

export interface OrderManagementRouteServices {
  orderController: OrderController;
  orderAddressController: OrderAddressController;
  orderItemController: OrderItemController;
  orderShipmentController: OrderShipmentController;
  orderStatusHistoryController: OrderStatusHistoryController;
  orderEventController: OrderEventController;
  preorderController: PreorderController;
  backorderController: BackorderController;
}

export async function registerOrderManagementRoutes(
  fastify: FastifyInstance,
  controllers: OrderManagementRouteServices,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await registerOrderRoutes(instance, controllers.orderController);
      await registerOrderAddressRoutes(instance, controllers.orderAddressController);
      await registerOrderItemRoutes(instance, controllers.orderItemController);
      await registerOrderShipmentRoutes(instance, controllers.orderShipmentController);
      await registerOrderStatusHistoryRoutes(instance, controllers.orderStatusHistoryController);
      await registerOrderEventRoutes(instance, controllers.orderEventController);
      await registerPreorderRoutes(instance, controllers.preorderController);
      await registerBackorderRoutes(instance, controllers.backorderController);
    },
    { prefix: "/api/v1" },
  );
}
