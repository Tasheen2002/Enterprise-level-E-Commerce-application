import { FastifyInstance } from "fastify";
import { StockController } from "../controllers/stock.controller";
import { LocationController } from "../controllers/location.controller";
import { SupplierController } from "../controllers/supplier.controller";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { PurchaseOrderItemController } from "../controllers/purchase-order-item.controller";
import { StockAlertController } from "../controllers/stock-alert.controller";
import { PickupReservationController } from "../controllers/pickup-reservation.controller";
import { InventoryTransactionController } from "../controllers/inventory-transaction.controller";
import {
  StockManagementService,
  LocationManagementService,
  SupplierManagementService,
  PurchaseOrderManagementService,
  StockAlertService,
  PickupReservationService,
  AddStockHandler,
  AdjustStockHandler,
  TransferStockHandler,
  ReserveStockHandler,
  FulfillReservationHandler,
  SetStockThresholdsHandler,
  GetStockHandler,
  GetStockByVariantHandler,
  GetStockStatsHandler,
  GetTotalAvailableStockHandler,
  ListStocksHandler,
  GetLowStockItemsHandler,
  GetOutOfStockItemsHandler,
  CreateLocationHandler,
  UpdateLocationHandler,
  DeleteLocationHandler,
  GetLocationHandler,
  ListLocationsHandler,
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  GetSupplierHandler,
  ListSuppliersHandler,
  CreatePurchaseOrderHandler,
  CreatePurchaseOrderWithItemsHandler,
  AddPOItemHandler,
  UpdatePOItemHandler,
  RemovePOItemHandler,
  UpdatePOStatusHandler,
  UpdatePOEtaHandler,
  ReceivePOItemsHandler,
  DeletePurchaseOrderHandler,
  GetPurchaseOrderHandler,
  GetPOItemsHandler,
  ListPurchaseOrdersHandler,
  GetOverduePurchaseOrdersHandler,
  GetPendingReceivalHandler,
  CreateStockAlertHandler,
  ResolveStockAlertHandler,
  GetStockAlertHandler,
  GetActiveAlertsHandler,
  ListStockAlertsHandler,
  CreatePickupReservationHandler,
  CancelPickupReservationHandler,
  GetPickupReservationHandler,
  ListPickupReservationsHandler,
  GetTransactionHandler,
  ListTransactionsHandler,
  GetTransactionsByVariantHandler,
} from "../../../application";
import { stockRoutes } from "./stock.routes";
import { locationRoutes } from "./location.routes";
import { supplierRoutes } from "./supplier.routes";
import { purchaseOrderRoutes } from "./purchase-order.routes";
import { purchaseOrderItemRoutes } from "./purchase-order-item.routes";
import { stockAlertRoutes } from "./stock-alert.routes";
import { pickupReservationRoutes } from "./pickup-reservation.routes";
import { inventoryTransactionRoutes } from "./inventory-transaction.routes";

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
  // Stock handlers
  const stockController = new StockController(
    new AddStockHandler(services.stockService),
    new AdjustStockHandler(services.stockService),
    new TransferStockHandler(services.stockService),
    new ReserveStockHandler(services.stockService),
    new FulfillReservationHandler(services.stockService),
    new SetStockThresholdsHandler(services.stockService),
    new GetStockHandler(services.stockService),
    new GetStockByVariantHandler(services.stockService),
    new GetStockStatsHandler(services.stockService),
    new GetTotalAvailableStockHandler(services.stockService),
    new ListStocksHandler(services.stockService),
    new GetLowStockItemsHandler(services.stockService),
    new GetOutOfStockItemsHandler(services.stockService),
  );

  // Location handlers
  const locationController = new LocationController(
    new CreateLocationHandler(services.locationService),
    new UpdateLocationHandler(services.locationService),
    new DeleteLocationHandler(services.locationService),
    new GetLocationHandler(services.locationService),
    new ListLocationsHandler(services.locationService),
  );

  // Supplier handlers
  const supplierController = new SupplierController(
    new CreateSupplierHandler(services.supplierService),
    new UpdateSupplierHandler(services.supplierService),
    new DeleteSupplierHandler(services.supplierService),
    new GetSupplierHandler(services.supplierService),
    new ListSuppliersHandler(services.supplierService),
  );

  // Purchase order handlers
  const poController = new PurchaseOrderController(
    new CreatePurchaseOrderHandler(services.poService),
    new CreatePurchaseOrderWithItemsHandler(services.poService),
    new AddPOItemHandler(services.poService),
    new UpdatePOItemHandler(services.poService),
    new RemovePOItemHandler(services.poService),
    new UpdatePOStatusHandler(services.poService),
    new ReceivePOItemsHandler(services.poService),
    new DeletePurchaseOrderHandler(services.poService),
    new GetPurchaseOrderHandler(services.poService),
    new GetPOItemsHandler(services.poService),
    new ListPurchaseOrdersHandler(services.poService),
    new GetOverduePurchaseOrdersHandler(services.poService),
    new GetPendingReceivalHandler(services.poService),
    new UpdatePOEtaHandler(services.poService),
  );

  // Purchase order item handlers (reuse PO service handlers)
  const poItemController = new PurchaseOrderItemController(
    new AddPOItemHandler(services.poService),
    new UpdatePOItemHandler(services.poService),
    new RemovePOItemHandler(services.poService),
    new GetPOItemsHandler(services.poService),
  );

  // Stock alert handlers
  const alertController = new StockAlertController(
    new CreateStockAlertHandler(services.alertService),
    new ResolveStockAlertHandler(services.alertService),
    new GetStockAlertHandler(services.alertService),
    new GetActiveAlertsHandler(services.alertService),
    new ListStockAlertsHandler(services.alertService),
  );

  // Pickup reservation handlers
  const reservationController = new PickupReservationController(
    new CreatePickupReservationHandler(services.reservationService),
    new CancelPickupReservationHandler(services.reservationService),
    new GetPickupReservationHandler(services.reservationService),
    new ListPickupReservationsHandler(services.reservationService),
  );

  // Inventory transaction handlers (use stock service)
  const transactionController = new InventoryTransactionController(
    new GetTransactionsByVariantHandler(services.stockService),
    new ListTransactionsHandler(services.stockService),
    new GetTransactionHandler(services.stockService),
  );

  await fastify.register(
    async (instance) => {
      await stockRoutes(instance, stockController);
      await locationRoutes(instance, locationController);
      await supplierRoutes(instance, supplierController);
      await purchaseOrderRoutes(instance, poController);
      await purchaseOrderItemRoutes(instance, poItemController);
      await stockAlertRoutes(instance, alertController);
      await pickupReservationRoutes(instance, reservationController);
      await inventoryTransactionRoutes(instance, transactionController);
    },
    { prefix: "/api/v1" },
  );
}
