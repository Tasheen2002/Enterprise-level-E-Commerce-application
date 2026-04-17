import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreatePurchaseOrderHandler,
  CreatePurchaseOrderWithItemsHandler,
  AddPOItemHandler,
  UpdatePOItemHandler,
  RemovePOItemHandler,
  UpdatePOStatusHandler,
  ReceivePOItemsHandler,
  DeletePurchaseOrderHandler,
  GetPurchaseOrderHandler,
  GetPOItemsHandler,
  ListPurchaseOrdersHandler,
  GetOverduePurchaseOrdersHandler,
  GetPendingReceivalHandler,
  UpdatePOEtaHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrderHandler: CreatePurchaseOrderHandler,
    private readonly createPurchaseOrderWithItemsHandler: CreatePurchaseOrderWithItemsHandler,
    private readonly addPOItemHandler: AddPOItemHandler,
    private readonly updatePOItemHandler: UpdatePOItemHandler,
    private readonly removePOItemHandler: RemovePOItemHandler,
    private readonly updatePOStatusHandler: UpdatePOStatusHandler,
    private readonly receivePOItemsHandler: ReceivePOItemsHandler,
    private readonly deletePurchaseOrderHandler: DeletePurchaseOrderHandler,
    private readonly getPurchaseOrderHandler: GetPurchaseOrderHandler,
    private readonly getPOItemsHandler: GetPOItemsHandler,
    private readonly listPurchaseOrdersHandler: ListPurchaseOrdersHandler,
    private readonly getOverduePurchaseOrdersHandler: GetOverduePurchaseOrdersHandler,
    private readonly getPendingReceivalHandler: GetPendingReceivalHandler,
    private readonly updatePOEtaHandler: UpdatePOEtaHandler,
  ) {}

  async getPurchaseOrder(
    request: AuthenticatedRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const result = await this.getPurchaseOrderHandler.handle({ poId });
      return ResponseHelper.ok(reply, "Purchase order retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createPurchaseOrder(
    request: AuthenticatedRequest<{
      Body: { supplierId: string; eta?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createPurchaseOrderHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Purchase order created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createPurchaseOrderWithItems(
    request: AuthenticatedRequest<{
      Body: {
        supplierId: string;
        eta?: string;
        items: Array<{ variantId: string; orderedQty: number }>;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createPurchaseOrderWithItemsHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Purchase order with items created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listPurchaseOrders(
    request: AuthenticatedRequest<{
      Querystring: {
        limit?: number;
        offset?: number;
        status?: string;
        supplierId?: string;
        sortBy?: "createdAt" | "updatedAt" | "eta";
        sortOrder?: "asc" | "desc";
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listPurchaseOrdersHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Purchase orders retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

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

  async addPOItem(
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
      return ResponseHelper.fromCommand(reply, result, "Item added successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePOItem(
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
      return ResponseHelper.fromCommand(reply, result, "Item updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removePOItem(
    request: AuthenticatedRequest<{
      Params: { poId: string; variantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const result = await this.removePOItemHandler.handle({ poId, variantId });
      return ResponseHelper.fromCommand(reply, result, "Item removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePOStatus(
    request: AuthenticatedRequest<{
      Params: { poId: string };
      Body: { status: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const { status } = request.body;
      const result = await this.updatePOStatusHandler.handle({ poId, status });
      return ResponseHelper.fromCommand(reply, result, "Status updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async receivePOItems(
    request: AuthenticatedRequest<{
      Params: { poId: string };
      Body: { locationId: string; items: Array<{ variantId: string; receivedQty: number }> };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const { locationId, items } = request.body;
      const result = await this.receivePOItemsHandler.handle({ poId, locationId, items });
      return ResponseHelper.fromCommand(reply, result, "Items received successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOverduePurchaseOrders(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getOverduePurchaseOrdersHandler.handle();
      return ResponseHelper.ok(reply, "Overdue purchase orders retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPendingReceival(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getPendingReceivalHandler.handle();
      return ResponseHelper.ok(reply, "Pending receival purchase orders retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePOEta(
    request: AuthenticatedRequest<{
      Params: { poId: string };
      Body: { eta: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const { eta } = request.body;
      const result = await this.updatePOEtaHandler.handle({ poId, eta });
      return ResponseHelper.fromCommand(reply, result, "ETA updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePurchaseOrder(
    request: AuthenticatedRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const result = await this.deletePurchaseOrderHandler.handle({ poId });
      return ResponseHelper.fromCommand(reply, result, "Purchase order deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
