import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateReturnRequestCommand,
  CreateReturnRequestHandler,
} from "../../../application/commands/create-return-request.command";
import {
  UpdateReturnRequestCommand,
  UpdateReturnRequestHandler,
} from "../../../application/commands/update-return-request.command";
import {
  DeleteReturnRequestCommand,
  DeleteReturnRequestHandler,
} from "../../../application/commands/delete-return-request.command";
import {
  GetReturnRequestQuery,
  GetReturnRequestHandler,
} from "../../../application/queries/get-return-request.query";
import {
  ListReturnRequestsQuery,
  ListReturnRequestsHandler,
} from "../../../application/queries/list-return-requests.query";
import { ReturnRequestService } from "../../../application/services/return-request.service";

interface CreateReturnRequestRequest {
  orderId: string;
  type: string;
  reason?: string;
}

interface UpdateReturnRequestRequest {
  status?: string;
  reason?: string;
}

export class ReturnRequestController {
  private createReturnRequestHandler: CreateReturnRequestHandler;
  private updateReturnRequestHandler: UpdateReturnRequestHandler;
  private deleteReturnRequestHandler: DeleteReturnRequestHandler;
  private getReturnRequestHandler: GetReturnRequestHandler;
  private listReturnRequestsHandler: ListReturnRequestsHandler;

  constructor(private readonly returnRequestService: ReturnRequestService) {
    this.createReturnRequestHandler = new CreateReturnRequestHandler(
      returnRequestService
    );
    this.updateReturnRequestHandler = new UpdateReturnRequestHandler(
      returnRequestService
    );
    this.deleteReturnRequestHandler = new DeleteReturnRequestHandler(
      returnRequestService
    );
    this.getReturnRequestHandler = new GetReturnRequestHandler(
      returnRequestService
    );
    this.listReturnRequestsHandler = new ListReturnRequestsHandler(
      returnRequestService
    );
  }

  async createReturnRequest(
    request: FastifyRequest<{ Body: CreateReturnRequestRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId, type, reason } = request.body;
      const command: CreateReturnRequestCommand = { orderId, type, reason };
      const result = await this.createReturnRequestHandler.handle(command);
      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Return request created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create return request",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create return request");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create return request",
      });
    }
  }

  async getReturnRequest(
    request: FastifyRequest<{ Params: { rmaId: string } }>,
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
      const query: GetReturnRequestQuery = { rmaId };
      const result = await this.getReturnRequestHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Return request not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve return request",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get return request");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve return request",
      });
    }
  }

  async listReturnRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: ListReturnRequestsQuery = {};
      const result = await this.listReturnRequestsHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list return requests",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list return requests");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to list return requests",
      });
    }
  }

  async updateReturnRequest(
    request: FastifyRequest<{
      Params: { rmaId: string };
      Body: UpdateReturnRequestRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { rmaId } = request.params;
      const { status, reason } = request.body;

      if (!rmaId || typeof rmaId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "RMA ID is required and must be a valid string",
        });
      }

      const command: UpdateReturnRequestCommand = {
        rmaId,
        status,
        reason,
      };

      const result = await this.updateReturnRequestHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Return request updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update return request",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update return request");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update return request",
      });
    }
  }

  async deleteReturnRequest(
    request: FastifyRequest<{ Params: { rmaId: string } }>,
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

      const command: DeleteReturnRequestCommand = { rmaId };
      const result = await this.deleteReturnRequestHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Return request deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to delete return request",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete return request");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete return request",
      });
    }
  }
}
