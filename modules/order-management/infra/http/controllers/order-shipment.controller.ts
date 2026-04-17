import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateShipmentCommand,
  CreateShipmentCommandHandler,
  UpdateShipmentTrackingCommand,
  UpdateShipmentTrackingCommandHandler,
  MarkShipmentShippedCommand,
  MarkShipmentShippedCommandHandler,
  MarkShipmentDeliveredCommand,
  MarkShipmentDeliveredCommandHandler,
  ListOrderShipmentsQuery,
  ListOrderShipmentsHandler,
  GetShipmentQuery,
  GetShipmentHandler,
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
    deliveredAt?: Date;
  };
}

export interface GetShipmentsRequest {
  Params: { orderId: string };
}

export interface GetShipmentRequest {
  Params: { orderId: string; shipmentId: string };
}

export class OrderShipmentController {
  constructor(
    private readonly createShipmentHandler: CreateShipmentCommandHandler,
    private readonly updateTrackingHandler: UpdateShipmentTrackingCommandHandler,
    private readonly markShippedHandler: MarkShipmentShippedCommandHandler,
    private readonly markDeliveredHandler: MarkShipmentDeliveredCommandHandler,
    private readonly listOrderShipmentsHandler: ListOrderShipmentsHandler,
    private readonly getShipmentHandler: GetShipmentHandler,
  ) {}

  async createShipment(
    request: AuthenticatedRequest<CreateShipmentRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: CreateShipmentCommand = {
        orderId: request.params.orderId,
        carrier: request.body.carrier,
        service: request.body.service,
        trackingNumber: request.body.trackingNumber,
        giftReceipt: request.body.giftReceipt,
        pickupLocationId: request.body.pickupLocationId,
      };
      const result = await this.createShipmentHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Shipment created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getShipments(
    request: AuthenticatedRequest<GetShipmentsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: ListOrderShipmentsQuery = { orderId: request.params.orderId };
      const result = await this.listOrderShipmentsHandler.handle(query);
      return ResponseHelper.ok(reply, "Shipments retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getShipment(
    request: AuthenticatedRequest<GetShipmentRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetShipmentQuery = {
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
      };
      const result = await this.getShipmentHandler.handle(query);
      return ResponseHelper.ok(reply, "Shipment retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markShipped(
    request: AuthenticatedRequest<MarkShippedRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: MarkShipmentShippedCommand = {
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        carrier: request.body.carrier,
        service: request.body.service,
        trackingNumber: request.body.trackingNumber,
      };
      const result = await this.markShippedHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Shipment marked as shipped successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateTracking(
    request: AuthenticatedRequest<UpdateTrackingRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdateShipmentTrackingCommand = {
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        trackingNumber: request.body.trackingNumber,
        carrier: request.body.carrier,
        service: request.body.service,
      };
      const result = await this.updateTrackingHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Shipment tracking updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markDelivered(
    request: AuthenticatedRequest<MarkDeliveredRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: MarkShipmentDeliveredCommand = {
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        deliveredAt: request.body.deliveredAt,
      };
      const result = await this.markDeliveredHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Shipment marked as delivered successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
