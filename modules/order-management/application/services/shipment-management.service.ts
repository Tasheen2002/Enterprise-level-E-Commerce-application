import {
  IOrderShipmentRepository,
  ShipmentQueryOptions,
} from "../../domain/repositories/order-shipment.repository";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";
import {
  OrderShipmentNotFoundError,
  DomainValidationError,
} from "../../domain/errors/order-management.errors";

interface CreateShipmentParams {
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt?: boolean;
  pickupLocationId?: string;
}

export class ShipmentManagementService {
  constructor(private readonly shipmentRepository: IOrderShipmentRepository) {}

  async createShipment(params: CreateShipmentParams): Promise<OrderShipmentDTO> {
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    const shipment = OrderShipment.create({
      orderId: params.orderId,
      carrier: params.carrier,
      service: params.service,
      trackingNumber: params.trackingNumber,
      giftReceipt: params.giftReceipt || false,
      pickupLocationId: params.pickupLocationId,
    });

    await this.shipmentRepository.save(shipment);

    return OrderShipment.toDTO(shipment);
  }

  async getShipmentById(id: string): Promise<OrderShipmentDTO | null> {
    if (!id || id.trim().length === 0) {
      throw new DomainValidationError("Shipment ID is required");
    }

    const shipment = await this.shipmentRepository.findById(id);
    return shipment ? OrderShipment.toDTO(shipment) : null;
  }

  async getShipmentsByOrderId(
    orderId: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    const shipments = await this.shipmentRepository.findByOrderId(orderId, options);
    return shipments.map((s) => OrderShipment.toDTO(s));
  }

  async getShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<OrderShipmentDTO | null> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new DomainValidationError("Tracking number is required");
    }

    const shipment = await this.shipmentRepository.findByTrackingNumber(trackingNumber);
    return shipment ? OrderShipment.toDTO(shipment) : null;
  }

  async getShipmentsByCarrier(
    carrier: string,
    options?: ShipmentQueryOptions,
  ): Promise<OrderShipmentDTO[]> {
    if (!carrier || carrier.trim().length === 0) {
      throw new DomainValidationError("Carrier is required");
    }

    const shipments = await this.shipmentRepository.findByCarrier(carrier, options);
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

  async markShipmentAsShipped(
    id: string,
    carrier: string,
    service: string,
    trackingNumber: string,
  ): Promise<OrderShipmentDTO> {
    if (!carrier || carrier.trim().length === 0) {
      throw new DomainValidationError("Carrier is required");
    }
    if (!service || service.trim().length === 0) {
      throw new DomainValidationError("Service is required");
    }
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new DomainValidationError("Tracking number is required");
    }

    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new OrderShipmentNotFoundError(id);

    shipment.markAsShipped(carrier, service, trackingNumber);
    await this.shipmentRepository.save(shipment);

    return OrderShipment.toDTO(shipment);
  }

  async markShipmentAsDelivered(id: string): Promise<OrderShipmentDTO> {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new OrderShipmentNotFoundError(id);

    shipment.markAsDelivered();
    await this.shipmentRepository.save(shipment);

    return OrderShipment.toDTO(shipment);
  }

  async updateTrackingNumber(
    id: string,
    trackingNumber: string,
  ): Promise<OrderShipmentDTO> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new DomainValidationError("Tracking number is required");
    }

    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new OrderShipmentNotFoundError(id);

    shipment.updateTrackingNumber(trackingNumber);
    await this.shipmentRepository.save(shipment);

    return OrderShipment.toDTO(shipment);
  }

  async deleteShipment(id: string): Promise<void> {
    const exists = await this.shipmentRepository.exists(id);
    if (!exists) throw new OrderShipmentNotFoundError(id);

    await this.shipmentRepository.delete(id);
  }

  async deleteShipmentsByOrderId(orderId: string): Promise<void> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    await this.shipmentRepository.deleteByOrderId(orderId);
  }

  async getShipmentCountByOrder(orderId: string): Promise<number> {
    if (!orderId || orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    return this.shipmentRepository.countByOrderId(orderId);
  }

  async getShipmentCountByCarrier(carrier: string): Promise<number> {
    if (!carrier || carrier.trim().length === 0) {
      throw new DomainValidationError("Carrier is required");
    }

    return this.shipmentRepository.countByCarrier(carrier);
  }

  async getShippedCount(): Promise<number> {
    return this.shipmentRepository.countShipped();
  }

  async getDeliveredCount(): Promise<number> {
    return this.shipmentRepository.countDelivered();
  }

  async shipmentExists(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new DomainValidationError("Shipment ID is required");
    }

    return this.shipmentRepository.exists(id);
  }

  async trackingNumberExists(trackingNumber: string): Promise<boolean> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new DomainValidationError("Tracking number is required");
    }

    return this.shipmentRepository.existsByTrackingNumber(trackingNumber);
  }
}
