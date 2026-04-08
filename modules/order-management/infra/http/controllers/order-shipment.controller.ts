import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateShipmentCommandHandler,
  UpdateShipmentTrackingCommandHandler,
  MarkShipmentShippedCommandHandler,
  MarkShipmentDeliveredCommandHandler,
  GetOrderShipmentsHandler,
  GetShipmentHandler,
  OrderManagementService,
  ShipmentManagementService,
} from "../../../application";

export interface CreateShipmentRequest {
  Params: { orderId: string };
  Body: {
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    giftReceipt?: boolean;
    pickupLocationId?: string;
  };
}

export interface MarkShippedRequest {
  Params: { orderId: string; shipmentId: string };
  Body: {
    carrier: string;
    service: string;
    trackingNumber: string;
  };
}

export interface UpdateTrackingRequest {
  Params: { orderId: string; shipmentId: string };
  Body: {
    trackingNumber: string;
    carrier?: string;
    service?: string;
  };
}

export interface MarkDeliveredRequest {
  Params: { orderId: string; shipmentId: string };
  Body: {
    deliveredAt?: string;
  };
}

export interface GetShipmentsRequest {
  Params: { orderId: string };
}

export interface GetShipmentRequest {
  Params: { orderId: string; shipmentId: string };
}

export class OrderShipmentController {
  private createShipmentHandler: CreateShipmentCommandHandler;
  private updateTrackingHandler: UpdateShipmentTrackingCommandHandler;
  private markShippedHandler: MarkShipmentShippedCommandHandler;
  private markDeliveredHandler: MarkShipmentDeliveredCommandHandler;
  private getOrderShipmentsHandler: GetOrderShipmentsHandler;
  private getShipmentHandler: GetShipmentHandler;

  constructor(
    orderService: OrderManagementService,
    shipmentService: ShipmentManagementService,
  ) {
    this.createShipmentHandler = new CreateShipmentCommandHandler(orderService);
    this.updateTrackingHandler = new UpdateShipmentTrackingCommandHandler(
      orderService,
    );
    this.markShippedHandler = new MarkShipmentShippedCommandHandler(
      orderService,
    );
    this.markDeliveredHandler = new MarkShipmentDeliveredCommandHandler(
      orderService,
    );
    this.getOrderShipmentsHandler = new GetOrderShipmentsHandler(
      shipmentService,
    );
    this.getShipmentHandler = new GetShipmentHandler(shipmentService);
  }

  async createShipment(
    request: FastifyRequest<CreateShipmentRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const {
        carrier,
        service,
        trackingNumber,
        giftReceipt,
        pickupLocationId,
      } = request.body;

      const result = await this.createShipmentHandler.handle({
        orderId,
        carrier,
        service,
        trackingNumber,
        giftReceipt,
        pickupLocationId,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Shipment created successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getShipments(
    request: FastifyRequest<GetShipmentsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const result = await this.getOrderShipmentsHandler.handle({ orderId });

      return ResponseHelper.fromQuery(reply, result, "Shipments retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getShipment(
    request: FastifyRequest<GetShipmentRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, shipmentId } = request.params;

      const result = await this.getShipmentHandler.handle({
        orderId,
        shipmentId,
      });

      return ResponseHelper.fromQuery(
        reply,
        result,
        "Shipment retrieved",
        "Shipment not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markShipped(
    request: FastifyRequest<MarkShippedRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, shipmentId } = request.params;
      const { carrier, service, trackingNumber } = request.body;

      const result = await this.markShippedHandler.handle({
        orderId,
        shipmentId,
        carrier,
        service,
        trackingNumber,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Shipment marked as shipped",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateTracking(
    request: FastifyRequest<UpdateTrackingRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, shipmentId } = request.params;
      const { trackingNumber, carrier, service } = request.body;

      const result = await this.updateTrackingHandler.handle({
        orderId,
        shipmentId,
        trackingNumber,
        carrier,
        service,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Tracking updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markDelivered(
    request: FastifyRequest<MarkDeliveredRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, shipmentId } = request.params;
      const { deliveredAt } = request.body;

      const result = await this.markDeliveredHandler.handle({
        orderId,
        shipmentId,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Shipment marked as delivered",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
