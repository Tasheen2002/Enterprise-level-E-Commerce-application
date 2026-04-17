import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  AddOrderItemCommand,
  AddOrderItemCommandHandler,
  UpdateOrderItemCommand,
  UpdateOrderItemCommandHandler,
  RemoveOrderItemCommand,
  RemoveOrderItemCommandHandler,
  ListOrderItemsQuery,
  ListOrderItemsHandler,
  GetOrderItemQuery,
  GetOrderItemHandler,
} from "../../../application";

export interface AddItemRequest {
  Params: { orderId: string };
  Body: {
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  };
}

export interface UpdateItemRequest {
  Params: { orderId: string; itemId: string };
  Body: {
    quantity?: number;
    isGift?: boolean;
    giftMessage?: string;
  };
}

export interface RemoveItemRequest {
  Params: { orderId: string; itemId: string };
}

export interface GetItemsRequest {
  Params: { orderId: string };
}

export interface GetItemRequest {
  Params: { orderId: string; itemId: string };
}

export class OrderItemController {
  constructor(
    private readonly addOrderItemHandler: AddOrderItemCommandHandler,
    private readonly updateOrderItemHandler: UpdateOrderItemCommandHandler,
    private readonly removeOrderItemHandler: RemoveOrderItemCommandHandler,
    private readonly listOrderItemsHandler: ListOrderItemsHandler,
    private readonly getOrderItemHandler: GetOrderItemHandler,
  ) {}

  async addItem(
    request: AuthenticatedRequest<AddItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: AddOrderItemCommand = {
        orderId: request.params.orderId,
        variantId: request.body.variantId,
        quantity: request.body.quantity,
        isGift: request.body.isGift,
        giftMessage: request.body.giftMessage,
      };
      const result = await this.addOrderItemHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Item added successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getItems(
    request: AuthenticatedRequest<GetItemsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: ListOrderItemsQuery = { orderId: request.params.orderId };
      const result = await this.listOrderItemsHandler.handle(query);
      return ResponseHelper.ok(reply, "Order items retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getItem(
    request: AuthenticatedRequest<GetItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetOrderItemQuery = { itemId: request.params.itemId };
      const result = await this.getOrderItemHandler.handle(query);
      return ResponseHelper.ok(reply, "Order item retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateItem(
    request: AuthenticatedRequest<UpdateItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdateOrderItemCommand = {
        orderId: request.params.orderId,
        itemId: request.params.itemId,
        quantity: request.body.quantity,
        isGift: request.body.isGift,
        giftMessage: request.body.giftMessage,
      };
      const result = await this.updateOrderItemHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Item updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeItem(
    request: AuthenticatedRequest<RemoveItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: RemoveOrderItemCommand = {
        orderId: request.params.orderId,
        itemId: request.params.itemId,
      };
      const result = await this.removeOrderItemHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Item removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
