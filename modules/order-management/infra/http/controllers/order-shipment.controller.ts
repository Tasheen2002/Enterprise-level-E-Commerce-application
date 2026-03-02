import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateShipmentCommandHandler,
  UpdateShipmentTrackingCommandHandler,
  MarkShipmentShippedCommandHandler,
  MarkShipmentDeliveredCommandHandler,
  GetOrderShipmentsHandler,
  GetShipmentHandler,
  OrderManagementService,
} from "../../../application";

interface CreateShipmentRequest {
  Params: { orderId: string };
  Body: {
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    giftReceipt?: boolean;
    pickupLocationId?: string;
  };
}

interface MarkShippedRequest {
  Params: { orderId: string; shipmentId: string };
  Body: {
    carrier: string;
    service: string;
    trackingNumber: string;
  };
}

interface UpdateTrackingRequest {
  Params: { orderId: string; shipmentId: string };
  Body: {
    trackingNumber: string;
    carrier?: string;
    service?: string;
  };
}

interface MarkDeliveredRequest {
  Params: { orderId: string; shipmentId: string };
  Body: {
    deliveredAt?: string;
  };
}

interface GetShipmentsRequest {
  Params: { orderId: string };
}

interface GetShipmentRequest {
  Params: { orderId: string; shipmentId: string };
}

export class OrderShipmentController {
  private createShipmentHandler: CreateShipmentCommandHandler;
  private updateTrackingHandler: UpdateShipmentTrackingCommandHandler;
  private markShippedHandler: MarkShipmentShippedCommandHandler;
  private markDeliveredHandler: MarkShipmentDeliveredCommandHandler;
  private getOrderShipmentsHandler: GetOrderShipmentsHandler;
  private getShipmentHandler: GetShipmentHandler;

  constructor(orderService: OrderManagementService) {
    this.createShipmentHandler = new CreateShipmentCommandHandler(orderService);
    this.updateTrackingHandler = new UpdateShipmentTrackingCommandHandler(orderService);
    this.markShippedHandler = new MarkShipmentShippedCommandHandler(orderService);
    this.markDeliveredHandler = new MarkShipmentDeliveredCommandHandler(orderService);
    this.getOrderShipmentsHandler = new GetOrderShipmentsHandler(orderService);
    this.getShipmentHandler = new GetShipmentHandler(orderService);
  }

  async createShipment(
    request: FastifyRequest<CreateShipmentRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { carrier, service, trackingNumber, giftReceipt, pickupLocationId } = request.body;

      const result = await this.createShipmentHandler.handle({
        orderId,
        carrier,
        service,
        trackingNumber,
        giftReceipt,
        pickupLocationId,
      });

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Shipment created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create shipment");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getShipments(
    request: FastifyRequest<GetShipmentsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const result = await this.getOrderShipmentsHandler.handle({ orderId });

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get order shipments");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getShipment(
    request: FastifyRequest<GetShipmentRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, shipmentId } = request.params;

      const result = await this.getShipmentHandler.handle({ orderId, shipmentId });

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get shipment");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Shipment marked as shipped successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to mark shipment as shipped");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Shipment tracking updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update shipment tracking");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Shipment marked as delivered successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to mark shipment as delivered");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
