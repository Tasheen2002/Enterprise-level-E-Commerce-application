import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddTicketMessageCommand,
  AddTicketMessageHandler,
} from "../../../application/commands/add-ticket-message.command";
import {
  GetTicketMessagesQuery,
  GetTicketMessagesHandler,
} from "../../../application/queries/get-ticket-messages.query";
import { TicketMessageService } from "../../../application/services/ticket-message.service";

interface AddMessageRequest {
  ticketId: string;
  sender: string;
  message: string;
}

interface GetMessagesQueryParams {
  sender?: string;
}

export class TicketMessageController {
  private addTicketMessageHandler: AddTicketMessageHandler;
  private getTicketMessagesHandler: GetTicketMessagesHandler;

  constructor(private readonly ticketMessageService: TicketMessageService) {
    // Initialize CQRS handlers
    this.addTicketMessageHandler = new AddTicketMessageHandler(
      ticketMessageService
    );
    this.getTicketMessagesHandler = new GetTicketMessagesHandler(
      ticketMessageService
    );
  }

  async addMessage(
    request: FastifyRequest<{
      Params: { ticketId: string };
      Body: Omit<AddMessageRequest, "ticketId">;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { ticketId } = request.params;
      const { sender, message } = request.body;

      // Basic HTTP validation
      if (!ticketId || typeof ticketId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Ticket ID is required and must be a valid string",
        });
      }

      if (!sender || typeof sender !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Sender is required and must be a valid string",
        });
      }

      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Message is required and must be a non-empty string",
        });
      }

      // Create command
      const command: AddTicketMessageCommand = {
        ticketId,
        sender,
        message,
      };

      // Execute command using handler
      const result = await this.addTicketMessageHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Ticket message added successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add ticket message",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add ticket message");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add ticket message",
      });
    }
  }

  async getMessages(
    request: FastifyRequest<{
      Params: { ticketId: string };
      Querystring: GetMessagesQueryParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { ticketId } = request.params;
      const { sender } = request.query;

      if (!ticketId || typeof ticketId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Ticket ID is required and must be a valid string",
        });
      }

      // Create query
      const query: GetTicketMessagesQuery = {
        ticketId,
        sender,
      };

      // Execute query using handler
      const result = await this.getTicketMessagesHandler.handle(query);

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
      request.log.error(error, "Failed to get ticket messages");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve ticket messages",
      });
    }
  }
}
