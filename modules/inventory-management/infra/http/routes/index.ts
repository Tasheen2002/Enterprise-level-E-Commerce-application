import { FastifyInstance } from "fastify";
import { StockController } from "../controllers/stock.controller";
import { LocationController } from "../controllers/location.controller";
import { SupplierController } from "../controllers/supplier.controller";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { PurchaseOrderItemController } from "../controllers/purchase-order-item.controller";
import { StockAlertController } from "../controllers/stock-alert.controller";
import { PickupReservationController } from "../controllers/pickup-reservation.controller";
import { InventoryTransactionController } from "../controllers/inventory-transaction.controller";
import { StockManagementService } from "../../../application/services/stock-management.service";
import { LocationManagementService } from "../../../application/services/location-management.service";
import { SupplierManagementService } from "../../../application/services/supplier-management.service";
import { PurchaseOrderManagementService } from "../../../application/services/purchase-order-management.service";
import { StockAlertService } from "../../../application/services/stock-alert.service";
import { PickupReservationService } from "../../../application/services/pickup-reservation.service";
import { registerStockRoutes } from "./stock.routes";
import { registerLocationRoutes } from "./location.routes";
import { registerSupplierRoutes } from "./supplier.routes";
import { registerPurchaseOrderRoutes } from "./purchase-order.routes";
import { registerPurchaseOrderItemRoutes } from "./purchase-order-item.routes";
import { registerStockAlertRoutes } from "./stock-alert.routes";
import { registerPickupReservationRoutes } from "./pickup-reservation.routes";
import { registerInventoryTransactionRoutes } from "./inventory-transaction.routes";

export interface InventoryManagementRouteServices {
  stockService: StockManagementService;
  locationService: LocationManagementService;
  supplierService: SupplierManagementService;
  poService: PurchaseOrderManagementService;
  alertService: StockAlertService;
  reservationService: PickupReservationService;
}

export async function registerInventoryManagementRoutes(
  fastify: FastifyInstance,
  services: InventoryManagementRouteServices,
): Promise<void> {
  const stockController = new StockController(services.stockService);
  const locationController = new LocationController(services.locationService);
  const supplierController = new SupplierController(services.supplierService);
  const poController = new PurchaseOrderController(services.poService);
  const poItemController = new PurchaseOrderItemController(services.poService);
  const alertController = new StockAlertController(services.alertService);
  const reservationController = new PickupReservationController(
    services.reservationService,
  );
  const transactionController = new InventoryTransactionController(
    services.stockService,
  );

  await fastify.register(
    async (instance) => {
      await registerStockRoutes(instance, stockController);
      await registerLocationRoutes(instance, locationController);
      await registerSupplierRoutes(instance, supplierController);
      await registerPurchaseOrderRoutes(instance, poController);
      await registerPurchaseOrderItemRoutes(instance, poItemController);
      await registerStockAlertRoutes(instance, alertController);
      await registerPickupReservationRoutes(instance, reservationController);
      await registerInventoryTransactionRoutes(instance, transactionController);
    },
    { prefix: "/api/v1" },
  );
}
