import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddPOItemCommand,
  AddPOItemCommandHandler,
  UpdatePOItemCommand,
  UpdatePOItemCommandHandler,
  RemovePOItemCommand,
  RemovePOItemCommandHandler,
  GetPOItemsQuery,
  GetPOItemsQueryHandler,
} from "../../../application";
import { PurchaseOrderManagementService } from "../../../application/services/purchase-order-management.service";

export class PurchaseOrderItemController {
  private addPOItemHandler: AddPOItemCommandHandler;
  private updatePOItemHandler: UpdatePOItemCommandHandler;
  private removePOItemHandler: RemovePOItemCommandHandler;
  private getPOItemsHandler: GetPOItemsQueryHandler;

  constructor(private readonly poService: PurchaseOrderManagementService) {
    this.addPOItemHandler = new AddPOItemCommandHandler(poService);
    this.updatePOItemHandler = new UpdatePOItemCommandHandler(poService);
    this.removePOItemHandler = new RemovePOItemCommandHandler(poService);
    this.getPOItemsHandler = new GetPOItemsQueryHandler(poService);
  }

  async getPOItems(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;

      const query: GetPOItemsQuery = { poId };
      const result = await this.getPOItemsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get purchase order items",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get purchase order items");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve purchase order items",
      });
    }
  }

  async addItem(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const body = request.body as any;

      const command: AddPOItemCommand = {
        poId,
        variantId: body.variantId,
        orderedQty: body.orderedQty,
      };

      const result = await this.addPOItemHandler.handle(command);

      if (result.success && result.data) {
        const item = result.data;

        return reply.code(201).send({
          success: true,
          data: {
            poId: item.getPoId().getValue(),
            variantId: item.getVariantId(),
            orderedQty: item.getOrderedQty(),
            receivedQty: item.getReceivedQty(),
          },
          message: "Item added to purchase order successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add item to purchase order",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add item to purchase order");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add item to purchase order",
      });
    }
  }

  async updateItem(
    request: FastifyRequest<{
      Params: { poId: string; variantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const body = request.body as any;

      const command: UpdatePOItemCommand = {
        poId,
        variantId,
        orderedQty: body.orderedQty,
      };

      const result = await this.updatePOItemHandler.handle(command);

      if (result.success && result.data) {
        const item = result.data;

        return reply.code(200).send({
          success: true,
          data: {
            poId: item.getPoId().getValue(),
            variantId: item.getVariantId(),
            orderedQty: item.getOrderedQty(),
            receivedQty: item.getReceivedQty(),
          },
          message: "Purchase order item updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update purchase order item",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update purchase order item");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update purchase order item",
      });
    }
  }

  async removeItem(
    request: FastifyRequest<{
      Params: { poId: string; variantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;

      const command: RemovePOItemCommand = {
        poId,
        variantId,
      };

      const result = await this.removePOItemHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Item removed from purchase order successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to remove item from purchase order",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to remove item from purchase order");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to remove item from purchase order",
      });
    }
  }
}
