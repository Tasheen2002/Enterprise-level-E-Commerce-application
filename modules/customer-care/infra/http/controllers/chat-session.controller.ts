import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateChatSessionCommand,
  CreateChatSessionHandler,
} from "../../../application/commands/create-chat-session.command";
import {
  EndChatSessionCommand,
  EndChatSessionHandler,
} from "../../../application/commands/end-chat-session.command";
import {
  GetChatSessionQuery,
  GetChatSessionHandler,
} from "../../../application/queries/get-chat-session.query";
import {
  ListChatSessionsQuery,
  ListChatSessionsHandler,
} from "../../../application/queries/list-chat-sessions.query";
import { ChatSessionService } from "../../../application/services/chat-session.service";

interface CreateSessionRequest {
  userId?: string;
  topic?: string;
  priority?: string;
}

export class ChatSessionController {
  private createChatSessionHandler: CreateChatSessionHandler;
  private endChatSessionHandler: EndChatSessionHandler;
  private getChatSessionHandler: GetChatSessionHandler;
  private listChatSessionsHandler: ListChatSessionsHandler;

  constructor(private readonly chatSessionService: ChatSessionService) {
    this.createChatSessionHandler = new CreateChatSessionHandler(
      chatSessionService
    );
    this.endChatSessionHandler = new EndChatSessionHandler(chatSessionService);
    this.getChatSessionHandler = new GetChatSessionHandler(chatSessionService);
    this.listChatSessionsHandler = new ListChatSessionsHandler(
      chatSessionService
    );
  }

  async createSession(
    request: FastifyRequest<{ Body: CreateSessionRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, topic, priority } = request.body;
      const command: CreateChatSessionCommand = { userId, topic, priority };
      const result = await this.createChatSessionHandler.handle(command);
      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Chat session created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create chat session",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create chat session");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create chat session",
      });
    }
  }

  async endSession(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { sessionId } = request.params;
      if (!sessionId || typeof sessionId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Session ID is required and must be a valid string",
        });
      }
      const command: EndChatSessionCommand = { sessionId };
      const result = await this.endChatSessionHandler.handle(command);
      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Chat session ended successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to end chat session",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to end chat session");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to end chat session",
      });
    }
  }

  async getSession(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { sessionId } = request.params;
      if (!sessionId || typeof sessionId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Session ID is required and must be a valid string",
        });
      }
      const query: GetChatSessionQuery = { sessionId };
      const result = await this.getChatSessionHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Chat session not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve chat session",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get chat session");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve chat session",
      });
    }
  }

  async listSessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: ListChatSessionsQuery = {};
      const result = await this.listChatSessionsHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list chat sessions",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list chat sessions");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to list chat sessions",
      });
    }
  }
}
