import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  AddPOItemHandler,
  UpdatePOItemHandler,
  RemovePOItemHandler,
  GetPOItemsHandler,
} from "../../../application";
import { PurchaseOrderManagementService } from "../../../application/services/purchase-order-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PurchaseOrderItemController {
  private addPOItemHandler: AddPOItemHandler;
  private updatePOItemHandler: UpdatePOItemHandler;
  private removePOItemHandler: RemovePOItemHandler;
  private getPOItemsHandler: GetPOItemsHandler;

  constructor(poService: PurchaseOrderManagementService) {
    this.addPOItemHandler = new AddPOItemHandler(poService);
    this.updatePOItemHandler = new UpdatePOItemHandler(poService);
    this.removePOItemHandler = new RemovePOItemHandler(poService);
    this.getPOItemsHandler = new GetPOItemsHandler(poService);
  }

  async getPOItems(
    request: AuthenticatedRequest<{
      Params: { poId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const result = await this.getPOItemsHandler.handle({ poId });
      return ResponseHelper.fromQuery(reply, result, "Purchase order items retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addItem(
    request: AuthenticatedRequest<{
      Params: { poId: string };
      Body: { variantId: string; orderedQty: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const { variantId, orderedQty } = request.body;
      const result = await this.addPOItemHandler.handle({ poId, variantId, orderedQty });
      if (result.success && result.data) {
        return ResponseHelper.created(reply, "Item added to purchase order successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to add item to purchase order");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateItem(
    request: AuthenticatedRequest<{
      Params: { poId: string; variantId: string };
      Body: { orderedQty: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const { orderedQty } = request.body;
      const result = await this.updatePOItemHandler.handle({ poId, variantId, orderedQty });
      if (result.success && result.data) {
        return ResponseHelper.ok(reply, "Purchase order item updated successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to update purchase order item");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeItem(
    request: AuthenticatedRequest<{
      Params: { poId: string; variantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const result = await this.removePOItemHandler.handle({ poId, variantId });
      return ResponseHelper.fromCommand(reply, result, "Item removed from purchase order successfully", undefined, 204);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
