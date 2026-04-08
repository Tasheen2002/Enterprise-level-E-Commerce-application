import { CustomerFeedbackService } from "../services/customer-feedback.service.js";

// Base interfaces
export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = void> {
  handle(query: TQuery): Promise<TResult>;
}

export class QueryResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): QueryResult<T> {
    return new QueryResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): QueryResult<T> {
    return new QueryResult<T>(false, undefined, error, errors);
  }
}

export interface ListCustomerFeedbackQuery extends IQuery {}

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

export class ListCustomerFeedbackHandler
  implements
    IQueryHandler<ListCustomerFeedbackQuery, QueryResult<CustomerFeedbackDto[]>>
{
  constructor(
    private readonly customerFeedbackService: CustomerFeedbackService
  ) {}

  async handle(
    query: ListCustomerFeedbackQuery
  ): Promise<QueryResult<CustomerFeedbackDto[]>> {
    try {
      const feedbacks = await this.customerFeedbackService.getAllFeedback();
      const result: CustomerFeedbackDto[] = feedbacks.map((feedback) => ({
        feedbackId: feedback.getFeedbackId().getValue(),
        userId: feedback.getUserId(),
        ticketId: feedback.getTicketId(),
        orderId: feedback.getOrderId(),
        npsScore: feedback.getNpsScore(),
        csatScore: feedback.getCsatScore(),
        comment: feedback.getComment(),
        createdAt: feedback.getCreatedAt(),
      }));
      return QueryResult.success<CustomerFeedbackDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<CustomerFeedbackDto[]>(
          "Failed to list customer feedback",
          [error.message]
        );
      }
      return QueryResult.failure<CustomerFeedbackDto[]>(
        "An unexpected error occurred while listing customer feedback"
      );
    }
  }
}
