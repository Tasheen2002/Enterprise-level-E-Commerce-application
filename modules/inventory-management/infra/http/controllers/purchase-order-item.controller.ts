import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  AddPOItemHandler,
  UpdatePOItemHandler,
  RemovePOItemHandler,
  GetPOItemsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PurchaseOrderItemController {
  constructor(
    private readonly addPOItemHandler: AddPOItemHandler,
    private readonly updatePOItemHandler: UpdatePOItemHandler,
    private readonly removePOItemHandler: RemovePOItemHandler,
    private readonly getPOItemsHandler: GetPOItemsHandler,
  ) {}

  async getPOItems(
    request: AuthenticatedRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const result = await this.getPOItemsHandler.handle({ poId });
      return ResponseHelper.ok(reply, "Purchase order items retrieved", result);
    } catch (error: unknown) {
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
      return ResponseHelper.fromCommand(reply, result, "Item added to purchase order successfully", 201);
    } catch (error: unknown) {
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
      return ResponseHelper.fromCommand(reply, result, "Purchase order item updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeItem(
    request: AuthenticatedRequest<{ Params: { poId: string; variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const result = await this.removePOItemHandler.handle({ poId, variantId });
      return ResponseHelper.fromCommand(reply, result, "Item removed from purchase order successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
