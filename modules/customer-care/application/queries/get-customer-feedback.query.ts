import {
  type IQuery,
  type IQueryHandler,
  QueryResult,
} from "../../../../packages/core/src/application/cqrs";
import { CustomerFeedbackService } from "../services/customer-feedback.service.js";

// Base interfaces

export interface GetCustomerFeedbackQuery extends IQuery {
  feedbackId: string;
}

export interface CustomerFeedbackDto {
  feedbackId: string;
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsScore?: number;
  csatScore?: number;
  comment?: string;
  createdAt: Date;
}

export class GetCustomerFeedbackHandler
  implements IQueryHandler<GetCustomerFeedbackQuery, QueryResult<CustomerFeedbackDto | null>>
{
  constructor(private readonly customerFeedbackService: CustomerFeedbackService) {}

  async handle(query: GetCustomerFeedbackQuery): Promise<QueryResult<CustomerFeedbackDto | null>> {
    try {
      if (!query.feedbackId) {
        return QueryResult.failure<CustomerFeedbackDto | null>("Feedback ID is required", [
          "feedbackId",
        ]);
      }

      const feedback = await this.customerFeedbackService.getFeedback(query.feedbackId);
      if (!feedback) {
        return QueryResult.success<CustomerFeedbackDto | null>(null);
      }
      const result: CustomerFeedbackDto = {
        feedbackId: feedback.getFeedbackId().getValue(),
        userId: feedback.getUserId(),
        ticketId: feedback.getTicketId(),
        orderId: feedback.getOrderId(),
        npsScore: feedback.getNpsScore(),
        csatScore: feedback.getCsatScore(),
        comment: feedback.getComment(),
        createdAt: feedback.getCreatedAt(),
      };
      return QueryResult.success<CustomerFeedbackDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<CustomerFeedbackDto | null>("Failed to get customer feedback", [
          error.message,
        ]);
      }
      return QueryResult.failure<CustomerFeedbackDto | null>(
        "An unexpected error occurred while getting customer feedback",
      );
    }
  }
}
