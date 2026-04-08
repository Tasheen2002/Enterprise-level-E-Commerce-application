import { FastifyRequest, FastifyReply } from "fastify";
import { ShipmentService } from "../../../application/services/shipment.service";
import { ShipmentItemService } from "../../../application/services/shipment-item.service";
import { AddShipmentItemCommandHandler } from "../../../application/commands/add-shipment-item.command";
import { RemoveShipmentItemCommandHandler } from "../../../application/commands/remove-shipment-item.command";
import { GetShipmentItemsQueryHandler } from "../../../application/queries/get-shipment-items.query";

interface GetShipmentItemsRequest {
  Params: { shipmentId: string };
}

interface AddShipmentItemRequest {
  Params: { shipmentId: string };
  Body: {
    orderItemId: string;
    qty: number;
  };
}

interface UpdateShipmentItemQtyRequest {
  Params: { shipmentId: string; orderItemId: string };
  Body: { qty: number };
}

interface UpdateShipmentItemGiftWrapRequest {
  Params: { shipmentId: string; orderItemId: string };
  Body: { giftWrap: boolean };
}

interface UpdateShipmentItemGiftMessageRequest {
  Params: { shipmentId: string; orderItemId: string };
  Body: { giftMessage?: string };
}

interface DeleteShipmentItemRequest {
  Params: { shipmentId: string; orderItemId: string };
}

export class ShipmentItemController {
  private addItemHandler: AddShipmentItemCommandHandler;
  private removeItemHandler: RemoveShipmentItemCommandHandler;
  private getItemsHandler: GetShipmentItemsQueryHandler;

  constructor(
    private readonly shipmentService: ShipmentService,
    private readonly shipmentItemService: ShipmentItemService
  ) {
    this.addItemHandler = new AddShipmentItemCommandHandler(shipmentService);
    this.removeItemHandler = new RemoveShipmentItemCommandHandler(
      shipmentService
    );
    this.getItemsHandler = new GetShipmentItemsQueryHandler(
      shipmentItemService
    );
  }

  async getShipmentItems(
    request: FastifyRequest<GetShipmentItemsRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const result = await this.getItemsHandler.handle({ shipmentId });

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      }
      return reply
        .code(400)
        .send({ success: false, error: result.error, errors: result.errors });
    } catch (error) {
      request.log.error(error, "Failed to get shipment items");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async addShipmentItem(
    request: FastifyRequest<AddShipmentItemRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId } = request.params;
      const { orderItemId, qty } = request.body;
      const result = await this.addItemHandler.handle({
        shipmentId,
        orderItemId,
        qty,
      });

      if (result.success) {
        const shipment = result.data as any;
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
      request.log.error(error, "Failed to add shipment item");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateShipmentItemQuantity(
    request: FastifyRequest<UpdateShipmentItemQtyRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId, orderItemId } = request.params;
      const { qty } = request.body;

      if (!qty || qty <= 0) {
        return reply
          .code(400)
          .send({ success: false, error: "qty must be greater than 0" });
      }

      const item = await this.shipmentItemService.updateShipmentItemQuantity(
        shipmentId,
        orderItemId,
        Number(qty)
      );
      return reply.code(200).send({ success: true, data: item });
    } catch (error) {
      request.log.error(error, "Failed to update shipment item quantity");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateShipmentItemGiftWrap(
    request: FastifyRequest<UpdateShipmentItemGiftWrapRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId, orderItemId } = request.params;
      const { giftWrap } = request.body;

      const item = await this.shipmentItemService.updateShipmentItemGiftWrap(
        shipmentId,
        orderItemId,
        Boolean(giftWrap)
      );
      return reply.code(200).send({ success: true, data: item });
    } catch (error) {
      request.log.error(error, "Failed to update shipment item gift wrap");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async updateShipmentItemGiftMessage(
    request: FastifyRequest<UpdateShipmentItemGiftMessageRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId, orderItemId } = request.params;
      const { giftMessage } = request.body;

      const item =
        await this.shipmentItemService.updateShipmentItemGiftMessage(
          shipmentId,
          orderItemId,
          giftMessage
        );
      return reply.code(200).send({ success: true, data: item });
    } catch (error) {
      request.log.error(error, "Failed to update shipment item gift message");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }

  async deleteShipmentItem(
    request: FastifyRequest<DeleteShipmentItemRequest>,
    reply: FastifyReply
  ) {
    try {
      const { shipmentId, orderItemId } = request.params;
      const result = await this.removeItemHandler.handle({
        shipmentId,
        orderItemId,
      });

      if (result.success) {
        return reply
          .code(200)
          .send({ success: true, data: result.data, message: "Item removed" });
      }
      return reply
        .code(400)
        .send({ success: false, error: result.error, errors: result.errors });
    } catch (error) {
      request.log.error(error, "Failed to delete shipment item");
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  }
}
