import { NewsletterService } from "../services/newsletter.service.js";

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

export interface GetNewsletterSubscriptionQuery extends IQuery {
  subscriptionId?: string;
  email?: string;
}

export interface NewsletterSubscriptionDto {
  subscriptionId: string;
  email: string;
  status: string;
  source?: string;
  createdAt: Date;
}

export class GetNewsletterSubscriptionHandler
  implements IQueryHandler<GetNewsletterSubscriptionQuery, QueryResult<NewsletterSubscriptionDto | null>>
{
  constructor(
    private readonly newsletterService: NewsletterService
  ) {}

  async handle(
    query: GetNewsletterSubscriptionQuery
  ): Promise<QueryResult<NewsletterSubscriptionDto | null>> {
    try {
      if (!query.subscriptionId && !query.email) {
        return QueryResult.failure<NewsletterSubscriptionDto | null>(
          "Either subscription ID or email is required",
          ["subscriptionId", "email"]
        );
      }

      let subscription;

      if (query.subscriptionId) {
        subscription = await this.newsletterService.getSubscription(
          query.subscriptionId
        );
      } else if (query.email) {
        subscription = await this.newsletterService.getSubscriptionByEmail(
          query.email
        );
      }

      if (!subscription) {
        return QueryResult.success<NewsletterSubscriptionDto | null>(null);
      }

      const result: NewsletterSubscriptionDto = {
        subscriptionId: subscription.getSubscriptionId().getValue(),
        email: subscription.getEmail(),
        status: subscription.getStatus().getValue(),
        source: subscription.getSource(),
        createdAt: subscription.getCreatedAt(),
      };

      return QueryResult.success<NewsletterSubscriptionDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<NewsletterSubscriptionDto | null>(
          "Failed to get newsletter subscription",
          [error.message]
        );
      }

      return QueryResult.failure<NewsletterSubscriptionDto | null>(
        "An unexpected error occurred while getting newsletter subscription"
      );
    }
  }
}
