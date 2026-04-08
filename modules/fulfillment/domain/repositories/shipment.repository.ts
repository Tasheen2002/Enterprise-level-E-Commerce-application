import { Shipment } from "../entities/shipment.entity";
import { ShipmentId, ShipmentStatus } from "../value-objects";

export interface ShipmentQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "shippedAt" | "deliveredAt";
  sortOrder?: "asc" | "desc";
}

export interface ShipmentFilterOptions {
  orderId?: string;
  status?: ShipmentStatus;
  carrier?: string;
  service?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IShipmentRepository {
  // Basic CRUD
  save(shipment: Shipment): Promise<void>;
  update(shipment: Shipment): Promise<void>;
  delete(shipmentId: ShipmentId): Promise<void>;

  // Finders
  findById(shipmentId: ShipmentId): Promise<Shipment | null>;
  findByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]>;
  findByStatus(
    status: ShipmentStatus,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]>;
  findByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]>;
  findAll(options?: ShipmentQueryOptions): Promise<Shipment[]>;

  // Advanced queries
  findWithFilters(
    filters: ShipmentFilterOptions,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]>;
  countByStatus(status: ShipmentStatus): Promise<number>;
  countByOrderId(orderId: string): Promise<number>;
  count(filters?: ShipmentFilterOptions): Promise<number>;

  // Existence checks
  exists(shipmentId: ShipmentId): Promise<boolean>;
  existsByOrderId(orderId: string): Promise<boolean>;

  // Business queries
  findPendingShipments(options?: ShipmentQueryOptions): Promise<Shipment[]>;
  findInTransitShipments(options?: ShipmentQueryOptions): Promise<Shipment[]>;
  findDeliveredShipments(
    startDate?: Date,
    endDate?: Date,
    options?: ShipmentQueryOptions
  ): Promise<Shipment[]>;
}
