import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreatePurchaseOrderHandler,
  CreatePurchaseOrderWithItemsHandler,
  UpdatePOStatusHandler,
  ReceivePOItemsHandler,
  DeletePurchaseOrderHandler,
  GetPurchaseOrderHandler,
  ListPurchaseOrdersHandler,
  GetOverduePurchaseOrdersHandler,
  GetPendingReceivalHandler,
  UpdatePOEtaHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  POParams,
  ListPurchaseOrdersQuery,
  CreatePurchaseOrderBody,
  CreatePurchaseOrderWithItemsBody,
  UpdatePOStatusBody,
  UpdatePOEtaBody,
  ReceivePOItemsBody,
} from "../validation/purchase-order.schema";

export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrderHandler: CreatePurchaseOrderHandler,
    private readonly createPurchaseOrderWithItemsHandler: CreatePurchaseOrderWithItemsHandler,
    private readonly updatePOStatusHandler: UpdatePOStatusHandler,
    private readonly receivePOItemsHandler: ReceivePOItemsHandler,
    private readonly deletePurchaseOrderHandler: DeletePurchaseOrderHandler,
    private readonly getPurchaseOrderHandler: GetPurchaseOrderHandler,
    private readonly listPurchaseOrdersHandler: ListPurchaseOrdersHandler,
    private readonly getOverduePurchaseOrdersHandler: GetOverduePurchaseOrdersHandler,
    private readonly getPendingReceivalHandler: GetPendingReceivalHandler,
    private readonly updatePOEtaHandler: UpdatePOEtaHandler,
  ) {}

  // ── Reads (queries) ────────────────────────────────────────────────

  async listPurchaseOrders(
    request: AuthenticatedRequest<{ Querystring: ListPurchaseOrdersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, status, supplierId, sortBy, sortOrder } = request.query;
      const result = await this.listPurchaseOrdersHandler.handle({
        limit,
        offset,
        status,
        supplierId,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.ok(reply, "Purchase orders retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOverduePurchaseOrders(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getOverduePurchaseOrdersHandler.handle({});
      return ResponseHelper.ok(reply, "Overdue purchase orders retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPendingReceival(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getPendingReceivalHandler.handle({});
      return ResponseHelper.ok(reply, "Pending receival purchase orders retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPurchaseOrder(
    request: AuthenticatedRequest<{ Params: POParams }>,
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

  // ── Writes (commands) ──────────────────────────────────────────────

  async createPurchaseOrder(
    request: AuthenticatedRequest<{ Body: CreatePurchaseOrderBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId, eta } = request.body;
      const result = await this.createPurchaseOrderHandler.handle({ supplierId, eta });
      return ResponseHelper.fromCommand(reply, result, "Purchase order created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createPurchaseOrderWithItems(
    request: AuthenticatedRequest<{ Body: CreatePurchaseOrderWithItemsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId, eta, items } = request.body;
      const result = await this.createPurchaseOrderWithItemsHandler.handle({ supplierId, eta, items });
      return ResponseHelper.fromCommand(reply, result, "Purchase order with items created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async receivePOItems(
    request: AuthenticatedRequest<{ Params: POParams; Body: ReceivePOItemsBody }>,
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

  async updatePOStatus(
    request: AuthenticatedRequest<{ Params: POParams; Body: UpdatePOStatusBody }>,
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

  async updatePOEta(
    request: AuthenticatedRequest<{ Params: POParams; Body: UpdatePOEtaBody }>,
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
    request: AuthenticatedRequest<{ Params: POParams }>,
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
