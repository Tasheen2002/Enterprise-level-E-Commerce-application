import {
  IOrderShipmentRepository,
  ShipmentQueryOptions,
} from "../../domain/repositories/order-shipment.repository";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export interface CreateShipmentData {
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt?: boolean;
  pickupLocationId?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export class ShipmentManagementService {
  constructor(private readonly shipmentRepository: IOrderShipmentRepository) {}

  async createShipment(data: CreateShipmentData): Promise<OrderShipment> {
    // Validate required fields
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    // Create the shipment entity
    const shipment = OrderShipment.create({
      orderId: data.orderId,
      carrier: data.carrier,
      service: data.service,
      trackingNumber: data.trackingNumber,
      giftReceipt: data.giftReceipt || false,
      pickupLocationId: data.pickupLocationId,
      shippedAt: data.shippedAt,
      deliveredAt: data.deliveredAt,
    });

    // Save the shipment
    await this.shipmentRepository.save(shipment);

    return shipment;
  }

  async getShipmentById(id: string): Promise<OrderShipment | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    return await this.shipmentRepository.findById(id);
  }

  async getShipmentsByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.shipmentRepository.findByOrderId(orderId, options);
  }

  async getShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipment | null> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new Error("Tracking number is required");
    }

    return await this.shipmentRepository.findByTrackingNumber(trackingNumber);
  }

  async getShipmentsByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    if (!carrier || carrier.trim().length === 0) {
      throw new Error("Carrier is required");
    }

    return await this.shipmentRepository.findByCarrier(carrier, options);
  }

  async getShippedShipments(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    return await this.shipmentRepository.findShipped(options);
  }

  async getDeliveredShipments(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    return await this.shipmentRepository.findDelivered(options);
  }

  async getPendingShipments(
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipment[]> {
    return await this.shipmentRepository.findPending(options);
  }

  async markShipmentAsShipped(
    id: string,
    carrier: string,
    service: string,
    trackingNumber: string,
  ): Promise<OrderShipment | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    if (!carrier || carrier.trim().length === 0) {
      throw new Error("Carrier is required");
    }

    if (!service || service.trim().length === 0) {
      throw new Error("Service is required");
    }

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new Error("Tracking number is required");
    }

    const shipment = await this.getShipmentById(id);
    if (!shipment) {
      return null;
    }

    shipment.markAsShipped(carrier, service, trackingNumber);

    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async markShipmentAsDelivered(id: string): Promise<OrderShipment | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    const shipment = await this.getShipmentById(id);
    if (!shipment) {
      return null;
    }

    shipment.markAsDelivered();

    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async updateTrackingNumber(
    id: string,
    trackingNumber: string,
  ): Promise<OrderShipment | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new Error("Tracking number is required");
    }

    const shipment = await this.getShipmentById(id);
    if (!shipment) {
      return null;
    }

    shipment.updateTrackingNumber(trackingNumber);

    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async deleteShipment(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    const shipment = await this.getShipmentById(id);
    if (!shipment) {
      return false;
    }

    await this.shipmentRepository.delete(id);
    return true;
  }

  async deleteShipmentsByOrderId(orderId: string): Promise<void> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    await this.shipmentRepository.deleteByOrderId(orderId);
  }

  async getShipmentCountByOrder(orderId: string): Promise<number> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.shipmentRepository.countByOrderId(orderId);
  }

  async getShipmentCountByCarrier(carrier: string): Promise<number> {
    if (!carrier || carrier.trim().length === 0) {
      throw new Error("Carrier is required");
    }

    return await this.shipmentRepository.countByCarrier(carrier);
  }

  async getShippedCount(): Promise<number> {
    return await this.shipmentRepository.countShipped();
  }

  async getDeliveredCount(): Promise<number> {
    return await this.shipmentRepository.countDelivered();
  }

  async shipmentExists(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error("Shipment ID is required");
    }

    return await this.shipmentRepository.exists(id);
  }

  async trackingNumberExists(trackingNumber: string): Promise<boolean> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new Error("Tracking number is required");
    }

    return await this.shipmentRepository.existsByTrackingNumber(trackingNumber);
  }
}
