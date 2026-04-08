import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddCustomerFeedbackCommand,
  AddCustomerFeedbackHandler,
} from "../../../application/commands/add-customer-feedback.command";
import {
  GetCustomerFeedbackQuery,
  GetCustomerFeedbackHandler,
} from "../../../application/queries/get-customer-feedback.query";
import {
  ListCustomerFeedbackQuery,
  ListCustomerFeedbackHandler,
} from "../../../application/queries/list-customer-feedback.query";
import { CustomerFeedbackService } from "../../../application/services/customer-feedback.service";

interface AddFeedbackRequest {
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsScore?: number;
  csatScore?: number;
  comment?: string;
}

export class CustomerFeedbackController {
  private addCustomerFeedbackHandler: AddCustomerFeedbackHandler;
  private getCustomerFeedbackHandler: GetCustomerFeedbackHandler;
  private listCustomerFeedbackHandler: ListCustomerFeedbackHandler;

  constructor(
    private readonly customerFeedbackService: CustomerFeedbackService
  ) {
    this.addCustomerFeedbackHandler = new AddCustomerFeedbackHandler(
      customerFeedbackService
    );
    this.getCustomerFeedbackHandler = new GetCustomerFeedbackHandler(
      customerFeedbackService
    );
    this.listCustomerFeedbackHandler = new ListCustomerFeedbackHandler(
      customerFeedbackService
    );
  }

  async addFeedback(
    request: FastifyRequest<{ Body: AddFeedbackRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, ticketId, orderId, npsScore, csatScore, comment } =
        request.body;
      const command: AddCustomerFeedbackCommand = {
        userId,
        ticketId,
        orderId,
        npsScore,
        csatScore,
        comment,
      };
      const result = await this.addCustomerFeedbackHandler.handle(command);
      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Customer feedback added successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add customer feedback",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add customer feedback");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add customer feedback",
      });
    }
  }

  async getFeedback(
    request: FastifyRequest<{ Params: { feedbackId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { feedbackId } = request.params;
      if (!feedbackId || typeof feedbackId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Feedback ID is required and must be a valid string",
        });
      }
      const query: GetCustomerFeedbackQuery = { feedbackId };
      const result = await this.getCustomerFeedbackHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Customer feedback not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve customer feedback",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get customer feedback");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve customer feedback",
      });
    }
  }

  async listFeedback(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: ListCustomerFeedbackQuery = {};
      const result = await this.listCustomerFeedbackHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list customer feedback",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list customer feedback");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to list customer feedback",
      });
    }
  }
}
