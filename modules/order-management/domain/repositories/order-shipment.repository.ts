import { OrderShipment } from "../entities/order-shipment.entity";

export interface ShipmentQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "shippedAt" | "deliveredAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface IOrderShipmentRepository {
  // Basic CRUD
  save(shipment: OrderShipment): Promise<void>;
  delete(shipmentId: string): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;

  // Finders
  findById(shipmentId: string): Promise<OrderShipment | null>;
  findByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]>;
  findByTrackingNumber(trackingNumber: string): Promise<OrderShipment | null>;
  findByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]>;
  findShipped(options?: ShipmentQueryOptions): Promise<OrderShipment[]>;
  findDelivered(options?: ShipmentQueryOptions): Promise<OrderShipment[]>;
  findPending(options?: ShipmentQueryOptions): Promise<OrderShipment[]>;

  // Queries
  countByOrderId(orderId: string): Promise<number>;
  countByCarrier(carrier: string): Promise<number>;
  countShipped(): Promise<number>;
  countDelivered(): Promise<number>;

  // Existence checks
  exists(shipmentId: string): Promise<boolean>;
  existsByTrackingNumber(trackingNumber: string): Promise<boolean>;
}
