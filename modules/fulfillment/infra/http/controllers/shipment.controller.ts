import { FastifyReply, FastifyRequest } from "fastify";
import { ShipmentService } from "../../../application/services/shipment.service";
import { ShipmentItemService } from "../../../application/services/shipment-item.service";
import { CreateShipmentCommandHandler } from "../../../application/commands/create-shipment.command";
import { UpdateShipmentStatusCommandHandler } from "../../../application/commands/update-shipment-status.command";
import { GetShipmentQueryHandler } from "../../../application/queries/get-shipment.query";
import { ListShipmentsQueryHandler } from "../../../application/queries/list-shipments.query";

interface CreateShipmentRequest {
  Body: {
    orderId: string;
    carrier?: string;
    service?: string;
    labelUrl?: string;
    isGift?: boolean;
    giftMessage?: string;
    items?: Array<{
      orderItemId: string;
      qty: number;
    }>;
  };
}

interface GetShipmentRequest {
  Params: { shipmentId: string };
}

interface ListShipmentsRequest {
  Querystring: {
    orderId?: string;
    status?: string;
    carrier?: string;
    limit?: string | number;
    offset?: string | number;
    sortBy?: "createdAt" | "updatedAt" | "shippedAt" | "deliveredAt";
    sortOrder?: "asc" | "desc";
  };
}

interface UpdateShipmentStatusRequest {
  Params: { shipmentId: string };
  Body: { status: string };
}

interface UpdateCarrierRequest {
  Params: { shipmentId: string };
  Body: { carrier: string };
}

interface UpdateServiceRequest {
  Params: { shipmentId: string };
  Body: { service: string };
}

interface UpdateLabelUrlRequest {
  Params: { shipmentId: string };
  Body: { labelUrl: string };
}

interface UpdateShipmentGiftRequest {
  Params: { shipmentId: string };
  Body: { isGift: boolean; giftMessage?: string };
}

export class ShipmentController {
  private createShipmentHandler: CreateShipmentCommandHandler;
  private updateStatusHandler: UpdateShipmentStatusCommandHandler;
  private getShipmentHandler: GetShipmentQueryHandler;
  private listShipmentsHandler: ListShipmentsQueryHandler;

  constructor(
    private readonly shipmentService: ShipmentService,
    private readonly shipmentItemService: ShipmentItemService
  ) {
    this.createShipmentHandler = new CreateShipmentCommandHandler(
      shipmentService
    );
    this.updateStatusHandler = new UpdateShipmentStatusCommandHandler(
      shipmentService
    );
    this.getShipmentHandler = new GetShipmentQueryHandler(shipmentService);
    this.listShipmentsHandler = new ListShipmentsQueryHandler(shipmentService);
  }

  async createShipment(
    request: FastifyRequest<CreateShipmentRequest>,
    reply: FastifyReply
  ) {
    try {
      const { orderId, carrier, service, labelUrl, isGift, giftMessage, items } = request.body;
      const result = await this.createShipmentHandler.handle({
        orderId,
        carrier,
        service,
        labelUrl,
        isGift,
        giftMessage,
        items,
      });

      if (result.success) {
        const shipment = result.data! as any;
        // Normalize response to avoid leaking item-level gift fields
        const normalized = {
          shipmentId: shipment.getShipmentId().getValue(),
          orderId: shipment.getOrderId(),
          carrier: shipment.getCarrier(),
          service: shipment.getService(),
          labelUrl: shipment.getLabelUrl(),
          status: shipment.getStatus().toString(),
          items: shipment.getItems().map((item: any) => ({
            orderItemId: item.getOrderItemId(),
            qty: item.getQty(),
            createdAt: item.getCreatedAt(),
            updatedAt: item.getUpdatedAt(),
          })),
          isGift: shipment.isGiftOrder(),
          giftMessage: shipment.getGiftMessage(),
          shippedAt: shipment.getShippedAt?.() || undefined,
          deliveredAt: shipment.getDeliveredAt?.() || undefined,
          createdAt: shipment.getCreatedAt(),
          updatedAt: shipment.getUpdatedAt(),
        };
        return reply.code(201).send({ success: true, data: normalized });
      }
      return reply
        .code(400)
        .send({ success: false, error: result.error, errors: result.errors });
    } catch (error) {
      request.log.error(error, "Failed to create shipment");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async getShipment(
    request: FastifyRequest<GetShipmentRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const result = await this.getShipmentHandler.handle({ shipmentId });

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      }
      return reply.code(404).send({ success: false, error: result.error || "Shipment not found" });
    } catch (error) {
      request.log.error(error, "Failed to get shipment");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async listShipments(
    request: FastifyRequest<ListShipmentsRequest>,
    reply: FastifyReply
  ) {
    try {
      const { orderId, status, carrier, limit, offset, sortBy, sortOrder } =
        (request.query as ListShipmentsRequest["Querystring"]) || {};

      const result = await this.listShipmentsHandler.handle({
        orderId,
        status,
        carrier,
        limit: typeof limit === "string" ? Number(limit) : limit,
        offset: typeof offset === "string" ? Number(offset) : offset,
        sortBy,
        sortOrder,
      });

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      }
      return reply
        .code(400)
        .send({ success: false, error: result.error, errors: result.errors });
    } catch (error) {
      request.log.error(error, "Failed to list shipments");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateShipmentStatus(
    request: FastifyRequest<UpdateShipmentStatusRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const { status } = request.body;
      const result = await this.updateStatusHandler.handle({ shipmentId, status });

      if (result.success) {
        return reply.code(200).send({ success: true, data: result.data });
      }
      return reply
        .code(400)
        .send({ success: false, error: result.error, errors: result.errors });
    } catch (error) {
      request.log.error(error, "Failed to update shipment status");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateCarrier(
    request: FastifyRequest<UpdateCarrierRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const { carrier } = request.body;

      if (!carrier?.trim()) {
        return reply
          .code(400)
          .send({ success: false, error: "carrier is required" });
      }

      const updated = await this.shipmentService.updateShipmentCarrier(
        shipmentId,
        carrier
      );
      return reply.code(200).send({ success: true, data: updated });
    } catch (error) {
      request.log.error(error, "Failed to update shipment carrier");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateService(
    request: FastifyRequest<UpdateServiceRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const { service } = request.body;

      if (!service?.trim()) {
        return reply
          .code(400)
          .send({ success: false, error: "service is required" });
      }

      const updated = await this.shipmentService.updateShipmentService(
        shipmentId,
        service
      );
      return reply.code(200).send({ success: true, data: updated });
    } catch (error) {
      request.log.error(error, "Failed to update shipment service");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateLabelUrl(
    request: FastifyRequest<UpdateLabelUrlRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const { labelUrl } = request.body;

      if (!labelUrl?.trim()) {
        return reply
          .code(400)
          .send({ success: false, error: "labelUrl is required" });
      }

      const updated = await this.shipmentService.updateShipmentLabelUrl(
        shipmentId,
        labelUrl
      );
      return reply.code(200).send({ success: true, data: updated });
    } catch (error) {
      request.log.error(error, "Failed to update shipment labelUrl");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateShipmentGift(
    request: FastifyRequest<UpdateShipmentGiftRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const { isGift, giftMessage } = request.body;

      const updated = await this.shipmentService.updateShipmentGift(
        shipmentId,
        Boolean(isGift),
        giftMessage
      );
      // Normalize response: remove item-level gift fields
      const normalized = {
        shipmentId: updated.getShipmentId().getValue(),
        orderId: updated.getOrderId(),
        carrier: updated.getCarrier(),
        service: updated.getService(),
        labelUrl: updated.getLabelUrl(),
        status: updated.getStatus().toString(),
        items: updated.getItems().map((item) => ({
          orderItemId: item.getOrderItemId(),
          qty: item.getQty(),
          createdAt: item.getCreatedAt(),
          updatedAt: item.getUpdatedAt(),
        })),
        isGift: updated.isGiftOrder(),
        giftMessage: updated.getGiftMessage(),
        shippedAt: updated.getShippedAt?.() || undefined,
        deliveredAt: updated.getDeliveredAt?.() || undefined,
        createdAt: updated.getCreatedAt(),
        updatedAt: updated.getUpdatedAt(),
      };
      return reply.code(200).send({ success: true, data: normalized });
    } catch (error) {
      request.log.error(error, "Failed to update shipment gift info");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }
}
