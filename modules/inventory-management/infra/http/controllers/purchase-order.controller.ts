import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreatePurchaseOrderCommand,
  CreatePurchaseOrderHandler,
  AddPOItemCommand,
  AddPOItemHandler,
  UpdatePOItemCommand,
  UpdatePOItemHandler,
  RemovePOItemCommand,
  RemovePOItemHandler,
  UpdatePOStatusCommand,
  UpdatePOStatusHandler,
  ReceivePOItemsCommand,
  ReceivePOItemsHandler,
  DeletePurchaseOrderCommand,
  DeletePurchaseOrderHandler,
  GetPurchaseOrderQuery,
  GetPurchaseOrderHandler,
  GetPOItemsQuery,
  GetPOItemsHandler,
  ListPurchaseOrdersQuery,
  ListPurchaseOrdersHandler,
} from "../../../application";
import { PurchaseOrderManagementService } from "../../../application/services/purchase-order-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PurchaseOrderController {
  private createPurchaseOrderHandler: CreatePurchaseOrderHandler;
  private addPOItemHandler: AddPOItemHandler;
  private updatePOItemHandler: UpdatePOItemHandler;
  private removePOItemHandler: RemovePOItemHandler;
  private updatePOStatusHandler: UpdatePOStatusHandler;
  private receivePOItemsHandler: ReceivePOItemsHandler;
  private deletePurchaseOrderHandler: DeletePurchaseOrderHandler;
  private getPurchaseOrderHandler: GetPurchaseOrderHandler;
  private getPOItemsHandler: GetPOItemsHandler;
  private listPurchaseOrdersHandler: ListPurchaseOrdersHandler;

  constructor(private readonly poService: PurchaseOrderManagementService) {
    this.createPurchaseOrderHandler = new CreatePurchaseOrderHandler(poService);
    this.addPOItemHandler = new AddPOItemHandler(poService);
    this.updatePOItemHandler = new UpdatePOItemHandler(poService);
    this.removePOItemHandler = new RemovePOItemHandler(poService);
    this.updatePOStatusHandler = new UpdatePOStatusHandler(poService);
    this.receivePOItemsHandler = new ReceivePOItemsHandler(poService);
    this.deletePurchaseOrderHandler = new DeletePurchaseOrderHandler(poService);
    this.getPurchaseOrderHandler = new GetPurchaseOrderHandler(poService);
    this.getPOItemsHandler = new GetPOItemsHandler(poService);
    this.listPurchaseOrdersHandler = new ListPurchaseOrdersHandler(poService);
  }

  async getPurchaseOrder(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const query: GetPurchaseOrderQuery = { poId };
      const result = await this.getPurchaseOrderHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Purchase order retrieved",
        "Purchase order not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createPurchaseOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const command: CreatePurchaseOrderCommand = {
        supplierId: body.supplierId,
        eta: body.eta ? new Date(body.eta) : undefined,
      };

      const result = await this.createPurchaseOrderHandler.handle(command);

      if (result.success && result.data) {
        const po = result.data;
        return ResponseHelper.created(
          reply,
          "Purchase order created successfully",
          {
            poId: po.getPoId().getValue(),
            supplierId: po.getSupplierId().getValue(),
            eta: po.getEta(),
            status: po.getStatus().getValue(),
            createdAt: po.getCreatedAt(),
            updatedAt: po.getUpdatedAt(),
          },
        );
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Purchase order creation failed",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createPurchaseOrderWithItems(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body as any;
      const errors: string[] = [];

      // Validation
      if (!body.supplierId || body.supplierId.trim().length === 0) {
        errors.push("supplierId: Supplier ID is required");
      }

      if (!Array.isArray(body.items) || body.items.length === 0) {
        errors.push("items: At least one item is required");
      } else {
        // Validate each item
        body.items.forEach((item: any, index: number) => {
          if (!item.variantId || item.variantId.trim().length === 0) {
            errors.push(`items[${index}].variantId: Variant ID is required`);
          }
          if (!item.orderedQty || item.orderedQty <= 0) {
            errors.push(
              `items[${index}].orderedQty: Ordered quantity must be greater than 0`,
            );
          }
        });
      }

      if (body.eta && isNaN(Date.parse(body.eta))) {
        errors.push("eta: Invalid date format");
      }

      if (errors.length > 0) {
        return ResponseHelper.badRequest(reply, "Validation failed", errors);
      }

      const command: CreatePurchaseOrderCommand = {
        supplierId: body.supplierId,
        eta: body.eta ? new Date(body.eta) : undefined,
      };

      const result = await this.createPurchaseOrderHandler.handle(command);

      if (result.success && result.data) {
        const po = result.data;
        // Add items if provided
        const items = Array.isArray(body.items) ? body.items : [];
        const addedItems = [];
        for (const item of items) {
          if (item.variantId && item.orderedQty) {
            const addItemResult = await this.addPOItemHandler.handle({
              poId: po.getPoId().getValue(),
              variantId: item.variantId,
              orderedQty: item.orderedQty,
            });
            if (addItemResult.success && addItemResult.data) {
              addedItems.push(addItemResult.data);
            }
          }
        }
        return ResponseHelper.created(
          reply,
          "Purchase order with items created successfully",
          {
            poId: po.getPoId().getValue(),
            supplierId: po.getSupplierId().getValue(),
            eta: po.getEta(),
            status: po.getStatus().getValue(),
            createdAt: po.getCreatedAt(),
            updatedAt: po.getUpdatedAt(),
            items: addedItems,
          },
        );
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Purchase order creation failed",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listPurchaseOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const listQuery: ListPurchaseOrdersQuery = {
        limit: query.limit ? Number(query.limit) : undefined,
        offset: query.offset ? Number(query.offset) : undefined,
        status: query.status,
        supplierId: query.supplierId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      const result = await this.listPurchaseOrdersHandler.handle(listQuery);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Purchase orders retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
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

  async addPOItem(
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item added successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePOItem(
    request: FastifyRequest<{ Params: { poId: string; variantId: string } }>,
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removePOItem(
    request: FastifyRequest<{ Params: { poId: string; variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId, variantId } = request.params;
      const command: RemovePOItemCommand = { poId, variantId };

      const result = await this.removePOItemHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item removed successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePOStatus(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const body = request.body as any;
      const command: UpdatePOStatusCommand = { poId, status: body.status };

      const result = await this.updatePOStatusHandler.handle(command);

      if (result.success && result.data) {
        const po = result.data;
        return ResponseHelper.ok(reply, "Status updated successfully", {
          poId: po.getPoId().getValue(),
          status: po.getStatus().getValue(),
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Failed to update status",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async receivePOItems(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const body = request.body as any;
      const command: ReceivePOItemsCommand = {
        poId,
        locationId: body.locationId,
        items: body.items,
      };

      const result = await this.receivePOItemsHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Items received successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePurchaseOrder(
    request: FastifyRequest<{ Params: { poId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { poId } = request.params;
      const command: DeletePurchaseOrderCommand = { poId };

      const result = await this.deletePurchaseOrderHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Purchase order deleted successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
