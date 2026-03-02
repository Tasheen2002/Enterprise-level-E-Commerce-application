import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreatePreorderCommandHandler,
  CreatePreorderCommand,
  UpdatePreorderReleaseDateCommandHandler,
  UpdatePreorderReleaseDateCommand,
  MarkPreorderNotifiedCommandHandler,
  MarkPreorderNotifiedCommand,
  DeletePreorderCommandHandler,
  DeletePreorderCommand,
  GetPreorderHandler,
  GetPreorderQuery,
  ListPreordersHandler,
  ListPreordersQuery,
  PreorderManagementService,
} from "../../../application";

interface CreatePreorderRequest {
  Body: {
    orderItemId: string;
    releaseDate?: string;
  };
}

interface UpdatePreorderReleaseDateRequest {
  Params: { orderItemId: string };
  Body: {
    releaseDate: string;
  };
}

interface MarkPreorderNotifiedRequest {
  Params: { orderItemId: string };
}

interface DeletePreorderRequest {
  Params: { orderItemId: string };
}

interface GetPreorderRequest {
  Params: { orderItemId: string };
}

interface ListPreordersRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    sortBy?: "releaseDate" | "notifiedAt";
    sortOrder?: "asc" | "desc";
    filterType?: "all" | "notified" | "unnotified" | "released";
  };
}

export class PreorderController {
  private createHandler: CreatePreorderCommandHandler;
  private updateReleaseDateHandler: UpdatePreorderReleaseDateCommandHandler;
  private markNotifiedHandler: MarkPreorderNotifiedCommandHandler;
  private deleteHandler: DeletePreorderCommandHandler;
  private getPreorderHandler: GetPreorderHandler;
  private listPreordersHandler: ListPreordersHandler;

  constructor(private readonly preorderService: PreorderManagementService) {
    this.createHandler = new CreatePreorderCommandHandler(preorderService);
    this.updateReleaseDateHandler = new UpdatePreorderReleaseDateCommandHandler(preorderService);
    this.markNotifiedHandler = new MarkPreorderNotifiedCommandHandler(preorderService);
    this.deleteHandler = new DeletePreorderCommandHandler(preorderService);
    this.getPreorderHandler = new GetPreorderHandler(preorderService);
    this.listPreordersHandler = new ListPreordersHandler(preorderService);
  }

  async createPreorder(
    request: FastifyRequest<CreatePreorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: CreatePreorderCommand = {
        orderItemId: request.body.orderItemId,
        releaseDate: request.body.releaseDate
          ? new Date(request.body.releaseDate)
          : undefined,
      };

      const result = await this.createHandler.handle(command);

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Preorder created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create preorder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updateReleaseDate(
    request: FastifyRequest<UpdatePreorderReleaseDateRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdatePreorderReleaseDateCommand = {
        orderItemId: request.params.orderItemId,
        releaseDate: new Date(request.body.releaseDate),
      };

      const result = await this.updateReleaseDateHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Preorder release date updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update preorder release date");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async markNotified(
    request: FastifyRequest<MarkPreorderNotifiedRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: MarkPreorderNotifiedCommand = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.markNotifiedHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Preorder marked as notified successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to mark preorder as notified");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async deletePreorder(
    request: FastifyRequest<DeletePreorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: DeletePreorderCommand = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.deleteHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Preorder deleted successfully",
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete preorder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getPreorder(
    request: FastifyRequest<GetPreorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetPreorderQuery = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.getPreorderHandler.handle(query);

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
      request.log.error(error, "Failed to get preorder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async listPreorders(
    request: FastifyRequest<ListPreordersRequest>,
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list preorders");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
