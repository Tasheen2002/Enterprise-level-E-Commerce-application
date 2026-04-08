import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddPOItemCommand,
  AddPOItemHandler,
  UpdatePOItemCommand,
  UpdatePOItemHandler,
  RemovePOItemCommand,
  RemovePOItemHandler,
  GetPOItemsQuery,
  GetPOItemsHandler,
} from "../../../application";
import { PurchaseOrderManagementService } from "../../../application/services/purchase-order-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface AddPOItemBody {
  variantId: string;
  orderedQty: number;
}

export interface UpdatePOItemBody {
  orderedQty: number;
}

export class PurchaseOrderItemController {
  private addPOItemHandler: AddPOItemHandler;
  private updatePOItemHandler: UpdatePOItemHandler;
  private removePOItemHandler: RemovePOItemHandler;
  private getPOItemsHandler: GetPOItemsHandler;

  constructor(private readonly poService: PurchaseOrderManagementService) {
    this.addPOItemHandler = new AddPOItemHandler(poService);
    this.updatePOItemHandler = new UpdatePOItemHandler(poService);
    this.removePOItemHandler = new RemovePOItemHandler(poService);
    this.getPOItemsHandler = new GetPOItemsHandler(poService);
  }

  async getPOItems(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;

      const query: GetPOItemsQuery = { poId };
      const result = await this.getPOItemsHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Purchase order items retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addItem(
    request: FastifyRequest<{ Params: { poId: string }; Body: AddPOItemBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const body = request.body;

      const command: AddPOItemCommand = {
        poId,
        variantId: body.variantId,
        orderedQty: body.orderedQty,
      };

      const result = await this.addPOItemHandler.handle(command);

      if (result.success && result.data) {
        const item = result.data;
        return ResponseHelper.created(
          reply,
          "Item added to purchase order successfully",
          {
            poId: item.getPoId().getValue(),
            variantId: item.getVariantId(),
            orderedQty: item.getOrderedQty(),
            receivedQty: item.getReceivedQty(),
          },
        );
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Failed to add item to purchase order",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateItem(
    request: FastifyRequest<{
      Params: { poId: string; variantId: string };
      Body: UpdatePOItemBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const body = request.body;

      const command: UpdatePOItemCommand = {
        poId,
        variantId,
        orderedQty: body.orderedQty,
      };

      const result = await this.updatePOItemHandler.handle(command);

      if (result.success && result.data) {
        const item = result.data;
        return ResponseHelper.ok(
          reply,
          "Purchase order item updated successfully",
          {
            poId: item.getPoId().getValue(),
            variantId: item.getVariantId(),
            orderedQty: item.getOrderedQty(),
            receivedQty: item.getReceivedQty(),
          },
        );
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Failed to update purchase order item",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item removed from purchase order successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
