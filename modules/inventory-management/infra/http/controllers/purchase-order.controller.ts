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
import { PurchaseOrderManagementService } from "../../../application/services/purchase-order-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PurchaseOrderController {
  private createPurchaseOrderHandler: CreatePurchaseOrderHandler;
  private createPurchaseOrderWithItemsHandler: CreatePurchaseOrderWithItemsHandler;
  private addPOItemHandler: AddPOItemHandler;
  private updatePOItemHandler: UpdatePOItemHandler;
  private removePOItemHandler: RemovePOItemHandler;
  private updatePOStatusHandler: UpdatePOStatusHandler;
  private receivePOItemsHandler: ReceivePOItemsHandler;
  private deletePurchaseOrderHandler: DeletePurchaseOrderHandler;
  private getPurchaseOrderHandler: GetPurchaseOrderHandler;
  private getPOItemsHandler: GetPOItemsHandler;
  private listPurchaseOrdersHandler: ListPurchaseOrdersHandler;
  private getOverduePurchaseOrdersHandler: GetOverduePurchaseOrdersHandler;
  private getPendingReceivalHandler: GetPendingReceivalHandler;
  private updatePOEtaHandler: UpdatePOEtaHandler;

  constructor(poService: PurchaseOrderManagementService) {
    this.createPurchaseOrderHandler = new CreatePurchaseOrderHandler(poService);
    this.createPurchaseOrderWithItemsHandler = new CreatePurchaseOrderWithItemsHandler(poService);
    this.addPOItemHandler = new AddPOItemHandler(poService);
    this.updatePOItemHandler = new UpdatePOItemHandler(poService);
    this.removePOItemHandler = new RemovePOItemHandler(poService);
    this.updatePOStatusHandler = new UpdatePOStatusHandler(poService);
    this.receivePOItemsHandler = new ReceivePOItemsHandler(poService);
    this.deletePurchaseOrderHandler = new DeletePurchaseOrderHandler(poService);
    this.getPurchaseOrderHandler = new GetPurchaseOrderHandler(poService);
    this.getPOItemsHandler = new GetPOItemsHandler(poService);
    this.listPurchaseOrdersHandler = new ListPurchaseOrdersHandler(poService);
    this.getOverduePurchaseOrdersHandler = new GetOverduePurchaseOrdersHandler(poService);
    this.getPendingReceivalHandler = new GetPendingReceivalHandler(poService);
    this.updatePOEtaHandler = new UpdatePOEtaHandler(poService);
  }

  async getPurchaseOrder(
    request: AuthenticatedRequest<{
      Params: { poId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const result = await this.getPurchaseOrderHandler.handle({ poId });
      return ResponseHelper.fromQuery(reply, result, "Purchase order retrieved", "Purchase order not found");
    } catch (error) {
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
      const { supplierId, eta } = request.body;
      const result = await this.createPurchaseOrderHandler.handle({
        supplierId,
        eta: eta ? new Date(eta) : undefined,
      });
      if (result.success && result.data) {
        return ResponseHelper.created(reply, "Purchase order created successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Purchase order creation failed");
    } catch (error) {
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
      const { supplierId, eta, items } = request.body;
      const result = await this.createPurchaseOrderWithItemsHandler.handle({
        supplierId,
        eta: eta ? new Date(eta) : undefined,
        items,
      });
      if (result.success && result.data) {
        return ResponseHelper.created(reply, "Purchase order with items created successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Purchase order creation failed");
    } catch (error) {
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
      const { limit, offset, status, supplierId, sortBy, sortOrder } = request.query;
      const result = await this.listPurchaseOrdersHandler.handle({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        status,
        supplierId,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.fromQuery(reply, result, "Purchase orders retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
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
    } catch (error) {
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
    } catch (error) {
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
      return ResponseHelper.fromCommand(reply, result, "Item removed successfully");
    } catch (error) {
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
      if (result.success && result.data) {
        return ResponseHelper.ok(reply, "Status updated successfully", {
          poId: result.data.poId,
          status: result.data.status,
        });
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to update status");
    } catch (error) {
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
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOverduePurchaseOrders(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getOverduePurchaseOrdersHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Overdue purchase orders retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPendingReceival(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getPendingReceivalHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Pending receival purchase orders retrieved");
    } catch (error) {
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
      const result = await this.updatePOEtaHandler.handle({ poId, eta: new Date(eta) });
      if (result.success && result.data) {
        return ResponseHelper.ok(reply, "ETA updated successfully", {
          poId: result.data.poId,
          eta: result.data.eta,
          status: result.data.status,
        });
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to update ETA");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePurchaseOrder(
    request: AuthenticatedRequest<{
      Params: { poId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const result = await this.deletePurchaseOrderHandler.handle({ poId });
      return ResponseHelper.fromCommand(reply, result, "Purchase order deleted successfully", undefined, 204);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
