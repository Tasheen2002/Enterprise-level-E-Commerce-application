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

      if (result.success && result.data) {
        const data = result.data;
        return reply.code(200).send({
          success: true,
          data,
        });
      } else if (result.success && result.data === null) {
        return reply
          .code(404)
          .send({ success: false, error: "Purchase order not found" });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get purchase order",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get purchase order");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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
        return reply.code(201).send({
          success: true,
          data: {
            poId: po.getPoId().getValue(),
            supplierId: po.getSupplierId().getValue(),
            eta: po.getEta(),
            status: po.getStatus().getValue(),
            createdAt: po.getCreatedAt(),
            updatedAt: po.getUpdatedAt(),
          },
          message: "Purchase order created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Purchase order creation failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create purchase order");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          errors: errors,
        });
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
        return reply.code(201).send({
          success: true,
          data: {
            poId: po.getPoId().getValue(),
            supplierId: po.getSupplierId().getValue(),
            eta: po.getEta(),
            status: po.getStatus().getValue(),
            createdAt: po.getCreatedAt(),
            updatedAt: po.getUpdatedAt(),
            items: addedItems,
          },
          message: "Purchase order with items created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Purchase order creation failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create purchase order with items");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list purchase orders",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list purchase orders");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get PO items",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get PO items");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Item added successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to add PO item");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: "Item updated successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to update PO item");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success) {
        return reply
          .code(200)
          .send({ success: true, message: "Item removed successfully" });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to remove PO item");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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
        return reply.code(200).send({
          success: true,
          data: {
            poId: po.getPoId().getValue(),
            status: po.getStatus().getValue(),
          },
          message: "Status updated successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to update PO status");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: "Items received successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to receive PO items");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Purchase order deleted successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete purchase order");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }
}
