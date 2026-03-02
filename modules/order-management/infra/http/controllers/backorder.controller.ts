import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateBackorderCommandHandler,
  CreateBackorderCommand,
  UpdateBackorderEtaCommandHandler,
  UpdateBackorderEtaCommand,
  MarkBackorderNotifiedCommandHandler,
  MarkBackorderNotifiedCommand,
  DeleteBackorderCommandHandler,
  DeleteBackorderCommand,
  GetBackorderHandler,
  GetBackorderQuery,
  ListBackordersHandler,
  ListBackordersQuery,
  BackorderManagementService,
} from "../../../application";

interface CreateBackorderRequest {
  Body: {
    orderItemId: string;
    promisedEta?: string;
  };
}

interface UpdateBackorderEtaRequest {
  Params: { orderItemId: string };
  Body: {
    promisedEta: string;
  };
}

interface MarkBackorderNotifiedRequest {
  Params: { orderItemId: string };
}

interface DeleteBackorderRequest {
  Params: { orderItemId: string };
}

interface GetBackorderRequest {
  Params: { orderItemId: string };
}

interface ListBackordersRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    sortBy?: "promisedEta" | "notifiedAt";
    sortOrder?: "asc" | "desc";
    filterType?: "all" | "notified" | "unnotified" | "overdue";
  };
}

export class BackorderController {
  private createHandler: CreateBackorderCommandHandler;
  private updateEtaHandler: UpdateBackorderEtaCommandHandler;
  private markNotifiedHandler: MarkBackorderNotifiedCommandHandler;
  private deleteHandler: DeleteBackorderCommandHandler;
  private getBackorderHandler: GetBackorderHandler;
  private listBackordersHandler: ListBackordersHandler;

  constructor(private readonly backorderService: BackorderManagementService) {
    this.createHandler = new CreateBackorderCommandHandler(backorderService);
    this.updateEtaHandler = new UpdateBackorderEtaCommandHandler(backorderService);
    this.markNotifiedHandler = new MarkBackorderNotifiedCommandHandler(backorderService);
    this.deleteHandler = new DeleteBackorderCommandHandler(backorderService);
    this.getBackorderHandler = new GetBackorderHandler(backorderService);
    this.listBackordersHandler = new ListBackordersHandler(backorderService);
  }

  async createBackorder(
    request: FastifyRequest<CreateBackorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: CreateBackorderCommand = {
        orderItemId: request.body.orderItemId,
        promisedEta: request.body.promisedEta
          ? new Date(request.body.promisedEta)
          : undefined,
      };

      const result = await this.createHandler.handle(command);

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Backorder created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create backorder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updatePromisedEta(
    request: FastifyRequest<UpdateBackorderEtaRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdateBackorderEtaCommand = {
        orderItemId: request.params.orderItemId,
        promisedEta: new Date(request.body.promisedEta),
      };

      const result = await this.updateEtaHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Backorder promised ETA updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update backorder ETA");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async markNotified(
    request: FastifyRequest<MarkBackorderNotifiedRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: MarkBackorderNotifiedCommand = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.markNotifiedHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Backorder marked as notified successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to mark backorder as notified");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async deleteBackorder(
    request: FastifyRequest<DeleteBackorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: DeleteBackorderCommand = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.deleteHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Backorder deleted successfully",
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete backorder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getBackorder(
    request: FastifyRequest<GetBackorderRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetBackorderQuery = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.getBackorderHandler.handle(query);

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
      request.log.error(error, "Failed to get backorder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async listBackorders(
    request: FastifyRequest<ListBackordersRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: ListBackordersQuery = {
        limit: request.query.limit,
        offset: request.query.offset,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
        filterType: request.query.filterType,
      };

      const result = await this.listBackordersHandler.handle(query);

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
      request.log.error(error, "Failed to list backorders");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
