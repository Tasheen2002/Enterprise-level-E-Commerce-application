import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddChatMessageCommand,
  AddChatMessageHandler,
} from "../../../application/commands/add-chat-message.command";
import {
  GetChatMessagesQuery,
  GetChatMessagesHandler,
} from "../../../application/queries/get-chat-messages.query";
import { ChatMessageService } from "../../../application/services/chat-message.service";

interface AddMessageRequest {
  senderId: string;
  senderType: string;
  content: string;
  messageType?: string;
  metadata?: Record<string, any>;
  isAutomated?: boolean;
}

export class ChatMessageController {
  private addChatMessageHandler: AddChatMessageHandler;
  private getChatMessagesHandler: GetChatMessagesHandler;

  constructor(private readonly chatMessageService: ChatMessageService) {
    // Initialize CQRS handlers
    this.addChatMessageHandler = new AddChatMessageHandler(chatMessageService);
    this.getChatMessagesHandler = new GetChatMessagesHandler(
      chatMessageService
    );
  }

  async addMessage(
    request: FastifyRequest<{
      Params: { sessionId: string };
      Body: AddMessageRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { sessionId } = request.params;
      const {
        senderId,
        senderType,
        content,
        messageType,
        metadata,
        isAutomated,
      } = request.body;

      // Basic HTTP validation
      if (!sessionId || typeof sessionId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Session ID is required and must be a valid string",
        });
      }

      if (!senderId || typeof senderId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Sender ID is required and must be a valid string",
        });
      }

      if (!senderType || typeof senderType !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Sender type is required and must be a valid string",
        });
      }

      if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Content is required and must be a non-empty string",
        });
      }

      // Create command
      const command: AddChatMessageCommand = {
        sessionId,
        senderId,
        senderType,
        content,
        messageType,
        metadata,
        isAutomated,
      };

      // Execute command using handler
      const result = await this.addChatMessageHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Chat message added successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add chat message",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add chat message");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add chat message",
      });
    }
  }

  async getMessages(
    request: FastifyRequest<{
      Params: { sessionId: string };
    }>,
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

      // Create query
      const query: GetChatMessagesQuery = {
        sessionId,
      };

      // Execute query using handler
      const result = await this.getChatMessagesHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error || "Messages not found",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get chat messages");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve chat messages",
      });
    }
  }
}
