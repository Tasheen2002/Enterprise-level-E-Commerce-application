import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateBackorderCommand,
  CreateBackorderCommandHandler,
  UpdateBackorderEtaCommand,
  UpdateBackorderEtaCommandHandler,
  MarkBackorderNotifiedCommand,
  MarkBackorderNotifiedCommandHandler,
  DeleteBackorderCommand,
  DeleteBackorderCommandHandler,
  GetBackorderQuery,
  GetBackorderHandler,
  ListBackordersQuery,
  ListBackordersHandler,
} from "../../../application";

export interface CreateBackorderRequest {
  Body: {
    orderItemId: string;
    promisedEta?: Date;
  };
}

export interface UpdateBackorderEtaRequest {
  Params: { orderItemId: string };
  Body: {
    promisedEta: Date;
  };
}

export interface MarkBackorderNotifiedRequest {
  Params: { orderItemId: string };
}

export interface DeleteBackorderRequest {
  Params: { orderItemId: string };
}

export interface GetBackorderRequest {
  Params: { orderItemId: string };
}

export interface ListBackordersRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    sortBy?: "promisedEta" | "notifiedAt";
    sortOrder?: "asc" | "desc";
    filterType?: "all" | "notified" | "unnotified" | "overdue";
  };
}

export class BackorderController {
  constructor(
    private readonly createHandler: CreateBackorderCommandHandler,
    private readonly updateEtaHandler: UpdateBackorderEtaCommandHandler,
    private readonly markNotifiedHandler: MarkBackorderNotifiedCommandHandler,
    private readonly deleteHandler: DeleteBackorderCommandHandler,
    private readonly getBackorderHandler: GetBackorderHandler,
    private readonly listBackordersHandler: ListBackordersHandler,
  ) {}

  async createBackorder(
    request: AuthenticatedRequest<CreateBackorderRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: CreateBackorderCommand = {
        orderItemId: request.body.orderItemId,
        promisedEta: request.body.promisedEta,
      };
      const result = await this.createHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Backorder created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getBackorder(
    request: AuthenticatedRequest<GetBackorderRequest>,
    reply: FastifyReply,
  ) {
    try {
      const query: GetBackorderQuery = { orderItemId: request.params.orderItemId };
      const result = await this.getBackorderHandler.handle(query);
      return ResponseHelper.ok(reply, "Backorder retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listBackorders(
    request: AuthenticatedRequest<ListBackordersRequest>,
    reply: FastifyReply,
  ) {
    try {
      const query: ListBackordersQuery = {
        limit: request.query.limit,
        offset: request.query.offset,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
        filterType: request.query.filterType,
      };
      const result = await this.listBackordersHandler.handle(query);
      return ResponseHelper.ok(reply, "Backorders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePromisedEta(
    request: AuthenticatedRequest<UpdateBackorderEtaRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: UpdateBackorderEtaCommand = {
        orderItemId: request.params.orderItemId,
        promisedEta: request.body.promisedEta,
      };
      const result = await this.updateEtaHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Backorder promised ETA updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markNotified(
    request: AuthenticatedRequest<MarkBackorderNotifiedRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: MarkBackorderNotifiedCommand = {
        orderItemId: request.params.orderItemId,
      };
      const result = await this.markNotifiedHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Backorder marked as notified successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBackorder(
    request: AuthenticatedRequest<DeleteBackorderRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: DeleteBackorderCommand = {
        orderItemId: request.params.orderItemId,
      };
      const result = await this.deleteHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Backorder deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
