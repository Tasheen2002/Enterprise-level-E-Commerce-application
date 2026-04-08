import { ShipmentItem } from "../entities/shipment-item.entity";
import { ShipmentId } from "../value-objects";

export interface ShipmentItemQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "qty";
  sortOrder?: "asc" | "desc";
}

export interface ShipmentItemFilterOptions {
  shipmentId?: string;
  orderItemId?: string;
  giftWrap?: boolean;
}

export interface IShipmentItemRepository {
  // Basic CRUD
  save(item: ShipmentItem): Promise<void>;
  update(item: ShipmentItem): Promise<void>;
  delete(shipmentId: string, orderItemId: string): Promise<void>;
  deleteByShipmentId(shipmentId: string): Promise<void>;

  // Finders
  findByShipmentId(
    shipmentId: string,
    options?: ShipmentItemQueryOptions
  ): Promise<ShipmentItem[]>;
  findByOrderItemId(orderItemId: string): Promise<ShipmentItem[]>;
  findByShipmentAndOrderItem(
    shipmentId: string,
    orderItemId: string
  ): Promise<ShipmentItem | null>;
  findAll(options?: ShipmentItemQueryOptions): Promise<ShipmentItem[]>;

  // Advanced queries
  findWithFilters(
    filters: ShipmentItemFilterOptions,
    options?: ShipmentItemQueryOptions
  ): Promise<ShipmentItem[]>;
  findGiftWrappedItems(
    shipmentId?: string,
    options?: ShipmentItemQueryOptions
  ): Promise<ShipmentItem[]>;
  getTotalQuantityByShipment(shipmentId: string): Promise<number>;
  count(filters?: ShipmentItemFilterOptions): Promise<number>;

  // Existence checks
  exists(shipmentId: string, orderItemId: string): Promise<boolean>;
  existsByShipmentId(shipmentId: string): Promise<boolean>;
  existsByOrderItemId(orderItemId: string): Promise<boolean>;
}
