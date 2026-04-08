import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateRepairCommand,
  CreateRepairHandler,
} from "../../../application/commands/create-repair.command";
import {
  UpdateRepairStatusCommand,
  UpdateRepairStatusHandler,
} from "../../../application/commands/update-repair-status.command";
import {
  UpdateRepairCommand,
  UpdateRepairHandler,
} from "../../../application/commands/update-repair.command";
import {
  DeleteRepairCommand,
  DeleteRepairHandler,
} from "../../../application/commands/delete-repair.command";
import {
  GetRepairQuery,
  GetRepairHandler,
} from "../../../application/queries/get-repair.query";
import {
  ListRepairsQuery,
  ListRepairsHandler,
} from "../../../application/queries/list-repairs.query";
import { RepairService } from "../../../application/services/repair.service";

interface CreateRepairRequest {
  orderItemId: string;
  notes?: string;
}

interface UpdateRepairStatusRequest {
  status: string;
}

interface UpdateRepairRequest {
  notes?: string;
  status?: string;
}

export class RepairController {
  private createRepairHandler: CreateRepairHandler;
  private updateRepairStatusHandler: UpdateRepairStatusHandler;
  private updateRepairHandler: UpdateRepairHandler;
  private deleteRepairHandler: DeleteRepairHandler;
  private getRepairHandler: GetRepairHandler;
  private listRepairsHandler: ListRepairsHandler;

  constructor(private readonly repairService: RepairService) {
    this.createRepairHandler = new CreateRepairHandler(repairService);
    this.updateRepairStatusHandler = new UpdateRepairStatusHandler(
      repairService
    );
    this.updateRepairHandler = new UpdateRepairHandler(repairService);
    this.deleteRepairHandler = new DeleteRepairHandler(repairService);
    this.getRepairHandler = new GetRepairHandler(repairService);
    this.listRepairsHandler = new ListRepairsHandler(repairService);
  }

  async createRepair(
    request: FastifyRequest<{ Body: CreateRepairRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { orderItemId, notes } = request.body;
      const command: CreateRepairCommand = { orderItemId, notes };
      const result = await this.createRepairHandler.handle(command);
      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Repair created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create repair",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create repair");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create repair",
      });
    }
  }

  async updateRepairStatus(
    request: FastifyRequest<{
      Params: { repairId: string };
      Body: UpdateRepairStatusRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { repairId } = request.params;
      const { status } = request.body;
      if (!repairId || typeof repairId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Repair ID is required and must be a valid string",
        });
      }
      if (!status || typeof status !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Status is required and must be a valid string",
        });
      }
      const command: UpdateRepairStatusCommand = { repairId, status };
      const result = await this.updateRepairStatusHandler.handle(command);
      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Repair status updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update repair status",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update repair status");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update repair status",
      });
    }
  }

  async getRepair(
    request: FastifyRequest<{ Params: { repairId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { repairId } = request.params;
      if (!repairId || typeof repairId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Repair ID is required and must be a valid string",
        });
      }
      const query: GetRepairQuery = { repairId };
      const result = await this.getRepairHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Repair not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve repair",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get repair");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve repair",
      });
    }
  }

  async listRepairs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: ListRepairsQuery = {};
      const result = await this.listRepairsHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list repairs",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list repairs");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to list repairs",
      });
    }
  }

  async updateRepair(
    request: FastifyRequest<{
      Params: { repairId: string };
      Body: UpdateRepairRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { repairId } = request.params;
      const { notes, status } = request.body;

      if (!repairId || typeof repairId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Repair ID is required and must be a valid string",
        });
      }

      const command: UpdateRepairCommand = {
        repairId,
        notes,
        status,
      };

      const result = await this.updateRepairHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Repair updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update repair",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update repair");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update repair",
      });
    }
  }

  async deleteRepair(
    request: FastifyRequest<{ Params: { repairId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { repairId } = request.params;

      if (!repairId || typeof repairId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Repair ID is required and must be a valid string",
        });
      }

      const command: DeleteRepairCommand = { repairId };
      const result = await this.deleteRepairHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Repair deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to delete repair",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete repair");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete repair",
      });
    }
  }
}
