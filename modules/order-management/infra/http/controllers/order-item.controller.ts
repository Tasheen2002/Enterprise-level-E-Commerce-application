import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  AddOrderItemHandler,
  UpdateOrderItemHandler,
  RemoveOrderItemHandler,
  ListOrderItemsHandler,
  GetOrderItemHandler,
} from "../../../application";
import {
  OrderItemsParams,
  OrderItemParams,
  AddOrderItemBody,
  UpdateOrderItemBody,
} from "../validation/order-item.schema";

export class OrderItemController {
  constructor(
    private readonly addOrderItemHandler: AddOrderItemHandler,
    private readonly updateOrderItemHandler: UpdateOrderItemHandler,
    private readonly removeOrderItemHandler: RemoveOrderItemHandler,
    private readonly listOrderItemsHandler: ListOrderItemsHandler,
    private readonly getOrderItemHandler: GetOrderItemHandler,
  ) {}

  async addItem(
    request: AuthenticatedRequest<{ Params: OrderItemsParams; Body: AddOrderItemBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addOrderItemHandler.handle({
        orderId: request.params.orderId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Item added successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getItems(
    request: AuthenticatedRequest<{ Params: OrderItemsParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listOrderItemsHandler.handle({ orderId: request.params.orderId });
      return ResponseHelper.ok(reply, "Order items retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getItem(
    request: AuthenticatedRequest<{ Params: OrderItemParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getOrderItemHandler.handle({ itemId: request.params.itemId });
      return ResponseHelper.ok(reply, "Order item retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateItem(
    request: AuthenticatedRequest<{ Params: OrderItemParams; Body: UpdateOrderItemBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateOrderItemHandler.handle({
        orderId: request.params.orderId,
        itemId: request.params.itemId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Item updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeItem(
    request: AuthenticatedRequest<{ Params: OrderItemParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeOrderItemHandler.handle({
        orderId: request.params.orderId,
        itemId: request.params.itemId,
      });
      return ResponseHelper.fromCommand(reply, result, "Item removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
