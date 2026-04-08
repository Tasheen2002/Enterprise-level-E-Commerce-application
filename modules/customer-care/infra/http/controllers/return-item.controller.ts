import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddReturnItemCommand,
  AddReturnItemHandler,
} from "../../../application/commands/add-return-item.command";
import {
  UpdateReturnItemConditionCommand,
  UpdateReturnItemConditionHandler,
} from "../../../application/commands/update-return-item-condition.command";
import {
  GetReturnItemQuery,
  GetReturnItemsQuery,
  GetReturnItemHandler,
  GetReturnItemsHandler,
} from "../../../application/queries/get-return-items.query";
import { ReturnItemService } from "../../../application/services/return-item.service";

interface AddReturnItemRequest {
  orderItemId: string;
  quantity: number;
  condition?: string;
  disposition?: string;
  fees?: number;
  currency?: string;
}

interface UpdateReturnItemConditionRequest {
  condition: string;
}

export class ReturnItemController {
  private addReturnItemHandler: AddReturnItemHandler;
  private updateReturnItemConditionHandler: UpdateReturnItemConditionHandler;
  private getReturnItemHandler: GetReturnItemHandler;
  private getReturnItemsHandler: GetReturnItemsHandler;

  constructor(private readonly returnItemService: ReturnItemService) {
    // Initialize CQRS handlers
    this.addReturnItemHandler = new AddReturnItemHandler(returnItemService);
    this.updateReturnItemConditionHandler =
      new UpdateReturnItemConditionHandler(returnItemService);
    this.getReturnItemHandler = new GetReturnItemHandler(returnItemService);
    this.getReturnItemsHandler = new GetReturnItemsHandler(returnItemService);
  }

  async addReturnItem(
    request: FastifyRequest<{
      Params: { rmaId: string };
      Body: AddReturnItemRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { rmaId } = request.params;
      const { orderItemId, quantity, condition, disposition, fees, currency } =
        request.body;

      // Basic HTTP validation
      if (!rmaId || typeof rmaId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "RMA ID is required and must be a valid string",
        });
      }

      if (!orderItemId || typeof orderItemId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Order Item ID is required and must be a valid string",
        });
      }

      if (!quantity || typeof quantity !== "number" || quantity <= 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Quantity is required and must be greater than 0",
        });
      }

      // Create command
      const command: AddReturnItemCommand = {
        rmaId,
        orderItemId,
        quantity,
        condition,
        disposition,
        fees,
        currency,
      };

      // Execute command using handler
      const result = await this.addReturnItemHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Return item added successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add return item",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add return item");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add return item",
      });
    }
  }

  async getReturnItem(
    request: FastifyRequest<{
      Params: { rmaId: string; orderItemId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { rmaId, orderItemId } = request.params;

      if (!rmaId || typeof rmaId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "RMA ID is required and must be a valid string",
        });
      }

      if (!orderItemId || typeof orderItemId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Order Item ID is required and must be a valid string",
        });
      }

      // Create query
      const query: GetReturnItemQuery = {
        rmaId,
        orderItemId,
      };

      // Execute query using handler
      const result = await this.getReturnItemHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Return item not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve return item",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get return item");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve return item",
      });
    }
  }

  async getReturnItems(
    request: FastifyRequest<{
      Params: { rmaId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { rmaId } = request.params;

      if (!rmaId || typeof rmaId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "RMA ID is required and must be a valid string",
        });
      }

      // Create query
      const query: GetReturnItemsQuery = {
        rmaId,
      };

      // Execute query using handler
      const result = await this.getReturnItemsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve return items",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get return items");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve return items",
      });
    }
  }

  async updateReturnItemCondition(
    request: FastifyRequest<{
      Params: { rmaId: string; orderItemId: string };
      Body: UpdateReturnItemConditionRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { rmaId, orderItemId } = request.params;
      const { condition } = request.body;

      // Basic HTTP validation
      if (!rmaId || typeof rmaId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "RMA ID is required and must be a valid string",
        });
      }

      if (!orderItemId || typeof orderItemId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Order Item ID is required and must be a valid string",
        });
      }

      if (!condition || typeof condition !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Condition is required and must be a valid string",
        });
      }

      // Create command
      const command: UpdateReturnItemConditionCommand = {
        rmaId,
        orderItemId,
        condition,
      };

      // Execute command using handler
      const result =
        await this.updateReturnItemConditionHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Return item condition updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update return item condition",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update return item condition");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Return item not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update return item condition",
      });
    }
  }
}
