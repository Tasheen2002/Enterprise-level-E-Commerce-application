import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
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

export interface CreateBackorderRequest {
  Body: {
    orderItemId: string;
    promisedEta?: string;
  };
}

export interface UpdateBackorderEtaRequest {
  Params: { orderItemId: string };
  Body: {
    promisedEta: string;
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
  private createHandler: CreateBackorderCommandHandler;
  private updateEtaHandler: UpdateBackorderEtaCommandHandler;
  private markNotifiedHandler: MarkBackorderNotifiedCommandHandler;
  private deleteHandler: DeleteBackorderCommandHandler;
  private getBackorderHandler: GetBackorderHandler;
  private listBackordersHandler: ListBackordersHandler;

  constructor(private readonly backorderService: BackorderManagementService) {
    this.createHandler = new CreateBackorderCommandHandler(backorderService);
    this.updateEtaHandler = new UpdateBackorderEtaCommandHandler(
      backorderService,
    );
    this.markNotifiedHandler = new MarkBackorderNotifiedCommandHandler(
      backorderService,
    );
    this.deleteHandler = new DeleteBackorderCommandHandler(backorderService);
    this.getBackorderHandler = new GetBackorderHandler(backorderService);
    this.listBackordersHandler = new ListBackordersHandler(backorderService);
  }

  async createBackorder(
    request: FastifyRequest<CreateBackorderRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: CreateBackorderCommand = {
        orderItemId: request.body.orderItemId,
        promisedEta: request.body.promisedEta
          ? new Date(request.body.promisedEta)
          : undefined,
      };

      const result = await this.createHandler.handle(command);

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Backorder created successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePromisedEta(
    request: FastifyRequest<UpdateBackorderEtaRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: UpdateBackorderEtaCommand = {
        orderItemId: request.params.orderItemId,
        promisedEta: new Date(request.body.promisedEta),
      };

      const result = await this.updateEtaHandler.handle(command);

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Backorder promised ETA updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markNotified(
    request: FastifyRequest<MarkBackorderNotifiedRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: MarkBackorderNotifiedCommand = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.markNotifiedHandler.handle(command);

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Backorder marked as notified successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBackorder(
    request: FastifyRequest<DeleteBackorderRequest>,
    reply: FastifyReply,
  ) {
    try {
      const command: DeleteBackorderCommand = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.deleteHandler.handle(command);

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Backorder deleted successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getBackorder(
    request: FastifyRequest<GetBackorderRequest>,
    reply: FastifyReply,
  ) {
    try {
      const query: GetBackorderQuery = {
        orderItemId: request.params.orderItemId,
      };

      const result = await this.getBackorderHandler.handle(query);

      return ResponseHelper.fromQuery(
        reply,
        result,
        "Backorder retrieved",
        "Backorder not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listBackorders(
    request: FastifyRequest<ListBackordersRequest>,
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

      return ResponseHelper.fromQuery(reply, result, "Backorders retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
