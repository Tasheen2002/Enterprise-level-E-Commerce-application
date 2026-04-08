import {
  ICustomerFeedbackRepository,
  FeedbackQueryOptions,
  FeedbackFilterOptions,
} from "../../domain/repositories/customer-feedback.repository.js";
import { CustomerFeedback } from "../../domain/entities/customer-feedback.entity.js";
import { FeedbackId } from "../../domain/value-objects/index.js";
import { SupportTicketService } from "./support-ticket.service.js";
import { OrderManagementService } from "../../../order-management/application/services/order-management.service.js";

export class CustomerFeedbackService {
  constructor(
    private readonly feedbackRepository: ICustomerFeedbackRepository,
    private readonly supportTicketService?: SupportTicketService,
    private readonly orderManagementService?: OrderManagementService
  ) {}

  async createFeedback(data: {
    userId?: string;
    ticketId?: string;
    orderId?: string;
    npsScore?: number;
    csatScore?: number;
    comment?: string;
  }): Promise<CustomerFeedback> {
    // Validation: If userId is provided with ticketId or orderId, validate ownership
    if (data.userId && data.ticketId && this.supportTicketService) {
      const ticket = await this.supportTicketService.getTicket(data.ticketId);
      if (!ticket) {
        throw new Error(`Ticket with ID ${data.ticketId} not found`);
      }

      // Check if the ticket belongs to the user
      const userTickets = await this.supportTicketService.getTicketsByUser(
        data.userId
      );
      const ticketBelongsToUser = userTickets.some(
        (t) => t.getTicketId().getValue() === data.ticketId
      );

      if (!ticketBelongsToUser) {
        throw new Error(
          `Ticket ${data.ticketId} does not belong to user ${data.userId}`
        );
      }
    }

    if (data.userId && data.orderId && this.orderManagementService) {
      const order = await this.orderManagementService.getOrderById(
        data.orderId
      );
      if (!order) {
        throw new Error(`Order with ID ${data.orderId} not found`);
      }

      // Check if the order belongs to the user
      if (order.getUserId() !== data.userId) {
        throw new Error(
          `Order ${data.orderId} does not belong to user ${data.userId}`
        );
      }
    }

    // If both ticketId and orderId are provided, validate they are related
    if (data.ticketId && data.orderId && this.supportTicketService) {
      const ticket = await this.supportTicketService.getTicket(data.ticketId);
      if (
        ticket &&
        ticket.getOrderId() &&
        ticket.getOrderId() !== data.orderId
      ) {
        throw new Error(
          `Ticket ${data.ticketId} is not related to order ${data.orderId}`
        );
      }
    }

    const feedback = CustomerFeedback.create({
      userId: data.userId,
      ticketId: data.ticketId,
      orderId: data.orderId,
      npsScore: data.npsScore,
      csatScore: data.csatScore,
      comment: data.comment,
    });

    await this.feedbackRepository.save(feedback);
    return feedback;
  }

  async getFeedback(feedbackId: string): Promise<CustomerFeedback | null> {
    return await this.feedbackRepository.findById(
      FeedbackId.create(feedbackId)
    );
  }

  async updateFeedback(
    feedbackId: string,
    data: {
      npsScore?: number;
      csatScore?: number;
      comment?: string;
    }
  ): Promise<void> {
    const feedback = await this.feedbackRepository.findById(
      FeedbackId.create(feedbackId)
    );

    if (!feedback) {
      throw new Error(`Feedback with ID ${feedbackId} not found`);
    }

    if (data.npsScore !== undefined) {
      feedback.updateNpsScore(data.npsScore);
    }

    if (data.csatScore !== undefined) {
      feedback.updateCsatScore(data.csatScore);
    }

    if (data.comment !== undefined) {
      feedback.updateComment(data.comment);
    }

    await this.feedbackRepository.update(feedback);
  }

  async deleteFeedback(feedbackId: string): Promise<void> {
    const exists = await this.feedbackRepository.exists(
      FeedbackId.create(feedbackId)
    );

    if (!exists) {
      throw new Error(`Feedback with ID ${feedbackId} not found`);
    }

    await this.feedbackRepository.delete(FeedbackId.create(feedbackId));
  }

  async getFeedbackByUser(
    userId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findByUserId(userId, options);
  }

  async getFeedbackByTicket(
    ticketId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findByTicketId(ticketId, options);
  }

  async getFeedbackByOrder(
    orderId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findByOrderId(orderId, options);
  }

  async getPromoters(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findPromoters(options);
  }

  async getPassives(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findPassives(options);
  }

  async getDetractors(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findDetractors(options);
  }

  async getPositiveCsat(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findPositiveCsat(options);
  }

  async getNegativeCsat(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findNegativeCsat(options);
  }

  async getFeedbackWithComments(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findWithComments(options);
  }

  async getRecentFeedbackByUser(
    userId: string,
    limit?: number
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findRecentByUser(userId, limit);
  }

  async getFeedbackWithFilters(
    filters: FeedbackFilterOptions,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findWithFilters(filters, options);
  }

  async getAllFeedback(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return await this.feedbackRepository.findAll(options);
  }

  async calculateNpsScore(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.calculateNpsScore(filters);
  }

  async getAverageNpsScore(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.getAverageNpsScore(filters);
  }

  async calculateCsatScore(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.calculateCsatScore(filters);
  }

  async getAverageCsatScore(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.getAverageCsatScore(filters);
  }

  async countPromoters(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.countPromoters(filters);
  }

  async countPassives(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.countPassives(filters);
  }

  async countDetractors(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.countDetractors(filters);
  }

  async countPositiveCsat(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.countPositiveCsat(filters);
  }

  async countNegativeCsat(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.countNegativeCsat(filters);
  }

  async countFeedbackByUser(userId: string): Promise<number> {
    return await this.feedbackRepository.countByUserId(userId);
  }

  async countFeedbackByTicket(ticketId: string): Promise<number> {
    return await this.feedbackRepository.countByTicketId(ticketId);
  }

  async countFeedbackByOrder(orderId: string): Promise<number> {
    return await this.feedbackRepository.countByOrderId(orderId);
  }

  async countFeedback(filters?: FeedbackFilterOptions): Promise<number> {
    return await this.feedbackRepository.count(filters);
  }

  async feedbackExists(feedbackId: string): Promise<boolean> {
    return await this.feedbackRepository.exists(FeedbackId.create(feedbackId));
  }

  async hasFeedbackForTicket(ticketId: string): Promise<boolean> {
    return await this.feedbackRepository.hasFeedbackForTicket(ticketId);
  }

  async hasFeedbackForOrder(orderId: string): Promise<boolean> {
    return await this.feedbackRepository.hasFeedbackForOrder(orderId);
  }
}
