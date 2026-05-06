import {
  IOrderShipmentRepository,
  ShipmentQueryOptions,
} from "../../domain/repositories/order-shipment.repository";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";
import { OrderShipmentNotFoundError } from "../../domain/errors/order-management.errors";
import { OrderId } from "../../domain/value-objects/order-id.vo";
import { ShipmentId } from "../../domain/value-objects/shipment-id.vo";

interface CreateShipmentParams {
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt?: boolean;
  pickupLocationId?: string;
}

interface MarkShippedParams {
  id: string;
  carrier: string;
  service: string;
  trackingNumber: string;
}

export class ShipmentManagementService {
  constructor(private readonly shipmentRepository: IOrderShipmentRepository) {}

  // ─── Writes ───────────────────────────────────────────────────────────────

  async createShipment(params: CreateShipmentParams): Promise<OrderShipmentDTO> {
    const shipment = OrderShipment.create({
      orderId: OrderId.fromString(params.orderId).getValue(),
      carrier: params.carrier,
      service: params.service,
      trackingNumber: params.trackingNumber,
      giftReceipt: params.giftReceipt ?? false,
      pickupLocationId: params.pickupLocationId,
    });

    await this.shipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

   async markShipmentAsShipped(params: MarkShippedParams): Promise<OrderShipmentDTO> {
    const shipment = await this.requireShipment(params.id);
    shipment.markAsShipped(params.carrier, params.service, params.trackingNumber);
    await this.shipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async markShipmentAsDelivered(
    id: string,
    deliveredAt?: Date,
  ): Promise<OrderShipmentDTO> {
    const shipment = await this.requireShipment(id);
    shipment.markAsDelivered(deliveredAt);
    await this.shipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async updateTrackingNumber(
    id: string,
    trackingNumber: string,
  ): Promise<OrderShipmentDTO> {
    const shipment = await this.requireShipment(id);
    shipment.updateTrackingNumber(trackingNumber);
    await this.shipmentRepository.save(shipment);
    return OrderShipment.toDTO(shipment);
  }

  async deleteShipment(id: string): Promise<void> {
    const shipmentVO = ShipmentId.fromString(id);
    const exists = await this.shipmentRepository.exists(shipmentVO);
    if (!exists) throw new OrderShipmentNotFoundError(id);
    await this.shipmentRepository.delete(shipmentVO);
  }

  async deleteShipmentsByOrderId(orderId: string): Promise<void> {
    await this.shipmentRepository.deleteByOrderId(
      OrderId.fromString(orderId),
    );
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async getShipmentById(id: string): Promise<OrderShipmentDTO | null> {
    const shipment = await this.shipmentRepository.findById(ShipmentId.fromString(id));
    return shipment ? OrderShipment.toDTO(shipment) : null;
  }

  async getShipmentsByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    const shipments = await this.shipmentRepository.findByOrderId(
      OrderId.fromString(orderId),
      options,
    );
    return shipments.map((s) => OrderShipment.toDTO(s));
  }

  async getShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipmentDTO | null> {
    const trimmed = trackingNumber.trim();
    if (trimmed.length === 0) return null;
    const shipment = await this.shipmentRepository.findByTrackingNumber(trimmed);
    return shipment ? OrderShipment.toDTO(shipment) : null;
  }

  async getShipmentsByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    const trimmed = carrier.trim();
    if (trimmed.length === 0) return [];
    const shipments = await this.shipmentRepository.findByCarrier(trimmed, options);
    return shipments.map((s) => OrderShipment.toDTO(s));
  }

  async getShippedShipments(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    const shipments = await this.shipmentRepository.findShipped(options);
    return shipments.map((s) => OrderShipment.toDTO(s));
  }

  async getDeliveredShipments(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    const shipments = await this.shipmentRepository.findDelivered(options);
    return shipments.map((s) => OrderShipment.toDTO(s));
  }

  async getPendingShipments(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    const shipments = await this.shipmentRepository.findPending(options);
    return shipments.map((s) => OrderShipment.toDTO(s));
  }

  // ─── Counters / existence ─────────────────────────────────────────────────

  async getShipmentCountByOrder(orderId: string): Promise<number> {
    return this.shipmentRepository.countByOrderId(
      OrderId.fromString(orderId),
    );
  }

  async getShipmentCountByCarrier(carrier: string): Promise<number> {
    const trimmed = carrier.trim();
    if (trimmed.length === 0) return 0;
    return this.shipmentRepository.countByCarrier(trimmed);
  }

  async getShippedCount(): Promise<number> {
    return this.shipmentRepository.countShipped();
  }

  async getDeliveredCount(): Promise<number> {
    return this.shipmentRepository.countDelivered();
  }

  async shipmentExists(id: string): Promise<boolean> {
    return this.shipmentRepository.exists(ShipmentId.fromString(id));
  }

  async trackingNumberExists(trackingNumber: string): Promise<boolean> {
    const trimmed = trackingNumber.trim();
    if (trimmed.length === 0) return false;
    return this.shipmentRepository.existsByTrackingNumber(trimmed);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async requireShipment(id: string): Promise<OrderShipment> {
    const shipment = await this.shipmentRepository.findById(ShipmentId.fromString(id));
    if (!shipment) throw new OrderShipmentNotFoundError(id);
    return shipment;
  }
}
