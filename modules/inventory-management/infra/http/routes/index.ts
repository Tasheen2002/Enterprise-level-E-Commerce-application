import { FastifyInstance } from "fastify";
import {
  StockController,
  LocationController,
  SupplierController,
  PurchaseOrderController,
  PurchaseOrderItemController,
  StockAlertController,
  PickupReservationController,
  InventoryTransactionController,
} from "../controllers";
import { stockRoutes } from "./stock.routes";
import { locationRoutes } from "./location.routes";
import { supplierRoutes } from "./supplier.routes";
import { purchaseOrderRoutes } from "./purchase-order.routes";
import { purchaseOrderItemRoutes } from "./purchase-order-item.routes";
import { stockAlertRoutes } from "./stock-alert.routes";
import { pickupReservationRoutes } from "./pickup-reservation.routes";
import { inventoryTransactionRoutes } from "./inventory-transaction.routes";

export interface InventoryManagementRouteServices {
  stockController: StockController;
  locationController: LocationController;
  supplierController: SupplierController;
  poController: PurchaseOrderController;
  poItemController: PurchaseOrderItemController;
  alertController: StockAlertController;
  pickupReservationController: PickupReservationController;
  inventoryTransactionController: InventoryTransactionController;
}

export async function registerInventoryManagementRoutes(
  fastify: FastifyInstance,
  controllers: InventoryManagementRouteServices,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await stockRoutes(instance, controllers.stockController);
      await locationRoutes(instance, controllers.locationController);
      await supplierRoutes(instance, controllers.supplierController);
      await purchaseOrderRoutes(instance, controllers.poController);
      await purchaseOrderItemRoutes(instance, controllers.poItemController);
      await stockAlertRoutes(instance, controllers.alertController);
      await pickupReservationRoutes(instance, controllers.pickupReservationController);
      await inventoryTransactionRoutes(instance, controllers.inventoryTransactionController);
    },
    { prefix: "/api/v1" },
  );
}
