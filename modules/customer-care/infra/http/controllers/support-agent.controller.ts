import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateSupportAgentCommand,
  CreateSupportAgentHandler,
} from "../../../application/commands/create-support-agent.command";
import {
  UpdateSupportAgentCommand,
  UpdateSupportAgentHandler,
} from "../../../application/commands/update-support-agent.command";
import {
  DeleteSupportAgentCommand,
  DeleteSupportAgentHandler,
} from "../../../application/commands/delete-support-agent.command";
import {
  GetSupportAgentQuery,
  GetSupportAgentHandler,
} from "../../../application/queries/get-support-agent.query";
import {
  ListSupportAgentsQuery,
  ListSupportAgentsHandler,
} from "../../../application/queries/list-support-agents.query";
import { SupportAgentService } from "../../../application/services/support-agent.service";

interface CreateSupportAgentRequest {
  name: string;
  roster?: string[];
  skills?: string[];
}

interface UpdateSupportAgentRequest {
  name?: string;
  roster?: string[];
  skills?: string[];
}

export class SupportAgentController {
  private createSupportAgentHandler: CreateSupportAgentHandler;
  private updateSupportAgentHandler: UpdateSupportAgentHandler;
  private deleteSupportAgentHandler: DeleteSupportAgentHandler;
  private getSupportAgentHandler: GetSupportAgentHandler;
  private listSupportAgentsHandler: ListSupportAgentsHandler;

  constructor(private readonly supportAgentService: SupportAgentService) {
    this.createSupportAgentHandler = new CreateSupportAgentHandler(
      supportAgentService
    );
    this.updateSupportAgentHandler = new UpdateSupportAgentHandler(
      supportAgentService
    );
    this.deleteSupportAgentHandler = new DeleteSupportAgentHandler(
      supportAgentService
    );
    this.getSupportAgentHandler = new GetSupportAgentHandler(
      supportAgentService
    );
    this.listSupportAgentsHandler = new ListSupportAgentsHandler(
      supportAgentService
    );
  }

  async createAgent(
    request: FastifyRequest<{ Body: CreateSupportAgentRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { name, roster, skills } = request.body;
      const command: CreateSupportAgentCommand = { name, roster, skills };
      const result = await this.createSupportAgentHandler.handle(command);
      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Support agent created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create support agent",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create support agent");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create support agent",
      });
    }
  }

  async updateAgent(
    request: FastifyRequest<{
      Params: { agentId: string };
      Body: UpdateSupportAgentRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { agentId } = request.params;
      const { name, roster, skills } = request.body;
      if (!agentId || typeof agentId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Agent ID is required and must be a valid string",
        });
      }
      if (!name && !roster && !skills) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "At least one of name, roster, or skills must be provided",
        });
      }
      const command: UpdateSupportAgentCommand = { agentId, name, roster, skills };
      const result = await this.updateSupportAgentHandler.handle(command);
      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Support agent updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update support agent",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update support agent");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update support agent",
      });
    }
  }

  async getAgent(
    request: FastifyRequest<{ Params: { agentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { agentId } = request.params;
      if (!agentId || typeof agentId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Agent ID is required and must be a valid string",
        });
      }
      const query: GetSupportAgentQuery = { agentId };
      const result = await this.getSupportAgentHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Support agent not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve support agent",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get support agent");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve support agent",
      });
    }
  }

  async listAgents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: ListSupportAgentsQuery = {};
      const result = await this.listSupportAgentsHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list support agents",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list support agents");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to list support agents",
      });
    }
  }

  async deleteAgent(
    request: FastifyRequest<{ Params: { agentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { agentId } = request.params;

      if (!agentId || typeof agentId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Agent ID is required and must be a valid string",
        });
      }

      const command: DeleteSupportAgentCommand = { agentId };
      const result = await this.deleteSupportAgentHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Support agent deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to delete support agent",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete support agent");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete support agent",
      });
    }
  }
}
