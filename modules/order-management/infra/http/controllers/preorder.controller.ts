import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
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

export interface CreatePreorderRequest {
  Body: {
    orderItemId: string;
    releaseDate?: string;
  };
}

export interface UpdatePreorderReleaseDateRequest {
  Params: { orderItemId: string };
  Body: {
    releaseDate: string;
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
  private createHandler: CreatePreorderCommandHandler;
  private updateReleaseDateHandler: UpdatePreorderReleaseDateCommandHandler;
  private markNotifiedHandler: MarkPreorderNotifiedCommandHandler;
  private deleteHandler: DeletePreorderCommandHandler;
  private getPreorderHandler: GetPreorderHandler;
  private listPreordersHandler: ListPreordersHandler;

  constructor(private readonly preorderService: PreorderManagementService) {
    this.createHandler = new CreatePreorderCommandHandler(preorderService);
    this.updateReleaseDateHandler = new UpdatePreorderReleaseDateCommandHandler(
      preorderService,
    );
    this.markNotifiedHandler = new MarkPreorderNotifiedCommandHandler(
      preorderService,
    );
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Preorder created successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Preorder release date updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Preorder marked as notified successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Preorder deleted successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Preorder retrieved successfully",
        "Preorder not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Preorders retrieved successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
