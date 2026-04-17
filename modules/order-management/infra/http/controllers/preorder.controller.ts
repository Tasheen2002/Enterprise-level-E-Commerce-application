import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreatePreorderCommand,
  CreatePreorderCommandHandler,
  UpdatePreorderReleaseDateCommand,
  UpdatePreorderReleaseDateCommandHandler,
  MarkPreorderNotifiedCommand,
  MarkPreorderNotifiedCommandHandler,
  DeletePreorderCommand,
  DeletePreorderCommandHandler,
  GetPreorderQuery,
  GetPreorderHandler,
  ListPreordersQuery,
  ListPreordersHandler,
} from "../../../application";

export interface CreatePreorderRequest {
  Body: {
    orderItemId: string;
    releaseDate?: Date;
  };
}

export interface UpdatePreorderReleaseDateRequest {
  Params: { orderItemId: string };
  Body: {
    releaseDate: Date;
  };
}

export interface MarkPreorderNotifiedRequest {
  Params: { orderItemId: string };
}

export interface DeletePreorderRequest {
  Params: { orderItemId: string };
}

export interface GetPreorderRequest {
  Params: { orderItemId: string };
}

export interface ListPreordersRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    sortBy?: "releaseDate" | "notifiedAt";
    sortOrder?: "asc" | "desc";
    filterType?: "all" | "notified" | "unnotified" | "released";
  };
}

export class PreorderController {
  constructor(
    private readonly createHandler: CreatePreorderCommandHandler,
    private readonly updateReleaseDateHandler: UpdatePreorderReleaseDateCommandHandler,
    private readonly markNotifiedHandler: MarkPreorderNotifiedCommandHandler,
    private readonly deleteHandler: DeletePreorderCommandHandler,
    private readonly getPreorderHandler: GetPreorderHandler,
    private readonly listPreordersHandler: ListPreordersHandler,
  ) {}

  async createPreorder(
    request: AuthenticatedRequest<CreatePreorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: CreatePreorderCommand = {
        orderItemId: request.body.orderItemId,
        releaseDate: request.body.releaseDate,
      };
      const result = await this.createHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Preorder created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPreorder(
    request: AuthenticatedRequest<GetPreorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetPreorderQuery = { orderItemId: request.params.orderItemId };
      const result = await this.getPreorderHandler.handle(query);
      return ResponseHelper.ok(reply, "Preorder retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listPreorders(
    request: AuthenticatedRequest<ListPreordersRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: ListPreordersQuery = {
        limit: request.query.limit,
        offset: request.query.offset,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
        filterType: request.query.filterType,
      };
      const result = await this.listPreordersHandler.handle(query);
      return ResponseHelper.ok(reply, "Preorders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateReleaseDate(
    request: AuthenticatedRequest<UpdatePreorderReleaseDateRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdatePreorderReleaseDateCommand = {
        orderItemId: request.params.orderItemId,
        releaseDate: request.body.releaseDate,
      };
      const result = await this.updateReleaseDateHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Preorder release date updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markNotified(
    request: AuthenticatedRequest<MarkPreorderNotifiedRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: MarkPreorderNotifiedCommand = {
        orderItemId: request.params.orderItemId,
      };
      const result = await this.markNotifiedHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Preorder marked as notified successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePreorder(
    request: AuthenticatedRequest<DeletePreorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: DeletePreorderCommand = {
        orderItemId: request.params.orderItemId,
      };
      const result = await this.deleteHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Preorder deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
