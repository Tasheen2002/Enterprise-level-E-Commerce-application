import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  AddOrderItemCommandHandler,
  AddOrderItemCommand,
  UpdateOrderItemCommandHandler,
  UpdateOrderItemCommand,
  RemoveOrderItemCommandHandler,
  RemoveOrderItemCommand,
  GetOrderItemsHandler,
  GetOrderItemsQuery,
  GetOrderItemHandler,
  GetOrderItemQuery,
  OrderManagementService,
  OrderItemManagementService,
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
  Params: { itemId: string };
}

export class OrderItemController {
  private addOrderItemHandler: AddOrderItemCommandHandler;
  private updateOrderItemHandler: UpdateOrderItemCommandHandler;
  private removeOrderItemHandler: RemoveOrderItemCommandHandler;
  private getOrderItemsHandler: GetOrderItemsHandler;
  private getOrderItemHandler: GetOrderItemHandler;

  constructor(
    private readonly orderService: OrderManagementService,
    private readonly orderItemService: OrderItemManagementService,
  ) {
    this.addOrderItemHandler = new AddOrderItemCommandHandler(orderService);
    this.updateOrderItemHandler = new UpdateOrderItemCommandHandler(
      orderService,
    );
    this.removeOrderItemHandler = new RemoveOrderItemCommandHandler(
      orderService,
    );
    this.getOrderItemsHandler = new GetOrderItemsHandler(orderItemService);
    this.getOrderItemHandler = new GetOrderItemHandler(orderItemService);
  }

  async addItem(
    request: FastifyRequest<AddItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { variantId, quantity, isGift, giftMessage } = request.body;

      const command: AddOrderItemCommand = {
        orderId,
        variantId,
        quantity,
        isGift,
        giftMessage,
      };

      const result = await this.addOrderItemHandler.handle(command);

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

  async getItems(
    request: FastifyRequest<GetItemsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const query: GetOrderItemsQuery = { orderId };
      const result = await this.getOrderItemsHandler.handle(query);

      return ResponseHelper.fromQuery(reply, result, "Order items retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getItem(
    request: FastifyRequest<GetItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { itemId } = request.params;

      const query: GetOrderItemQuery = { itemId };
      const result = await this.getOrderItemHandler.handle(query);

      return ResponseHelper.fromQuery(
        reply,
        result,
        "Order item retrieved",
        "Order item not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateItem(
    request: FastifyRequest<UpdateItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, itemId } = request.params;
      const { quantity, isGift, giftMessage } = request.body;

      const command: UpdateOrderItemCommand = {
        orderId,
        itemId,
        quantity,
        isGift,
        giftMessage,
      };

      const result = await this.updateOrderItemHandler.handle(command);

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeItem(
    request: FastifyRequest<RemoveItemRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId, itemId } = request.params;

      const command: RemoveOrderItemCommand = {
        orderId,
        itemId,
      };

      const result = await this.removeOrderItemHandler.handle(command);

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item removed successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
