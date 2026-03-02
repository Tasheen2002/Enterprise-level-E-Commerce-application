import { FastifyRequest, FastifyReply } from "fastify";
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
} from "../../../application";

interface AddItemRequest {
  Params: { orderId: string };
  Body: {
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  };
}

interface UpdateItemRequest {
  Params: { orderId: string; itemId: string };
  Body: {
    quantity?: number;
    isGift?: boolean;
    giftMessage?: string;
  };
}

interface RemoveItemRequest {
  Params: { orderId: string; itemId: string };
}

interface GetItemsRequest {
  Params: { orderId: string };
}

interface GetItemRequest {
  Params: { itemId: string };
}

export class OrderItemController {
  private addOrderItemHandler: AddOrderItemCommandHandler;
  private updateOrderItemHandler: UpdateOrderItemCommandHandler;
  private removeOrderItemHandler: RemoveOrderItemCommandHandler;
  private getOrderItemsHandler: GetOrderItemsHandler;
  private getOrderItemHandler: GetOrderItemHandler;

  constructor(private readonly orderService: OrderManagementService) {
    this.addOrderItemHandler = new AddOrderItemCommandHandler(orderService);
    this.updateOrderItemHandler = new UpdateOrderItemCommandHandler(
      orderService,
    );
    this.removeOrderItemHandler = new RemoveOrderItemCommandHandler(
      orderService,
    );
    this.getOrderItemsHandler = new GetOrderItemsHandler(orderService);
    this.getOrderItemHandler = new GetOrderItemHandler(orderService);
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

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data?.toData(),
          message: "Item added successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Order item controller error");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Order item controller error");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Order item controller error");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toData(),
          message: "Item updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Order item controller error");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Item removed successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Order item controller error");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
