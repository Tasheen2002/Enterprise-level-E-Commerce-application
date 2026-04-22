import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { NewsletterService } from "../services/newsletter.service";
import { SubscriptionDTO } from "../../domain/entities/newsletter-subscription.entity";
import {
  NewsletterSubscriptionNotFoundError,
  DomainValidationError,
} from "../../domain/errors/engagement.errors";

export interface GetNewsletterSubscriptionQuery extends IQuery {
  readonly subscriptionId?: string;
  readonly email?: string;
}

export class GetNewsletterSubscriptionHandler
  implements IQueryHandler<GetNewsletterSubscriptionQuery, SubscriptionDTO>
{
  constructor(private readonly newsletterService: NewsletterService) {}

  async handle(query: GetNewsletterSubscriptionQuery): Promise<SubscriptionDTO> {
    if (query.subscriptionId) {
      const dto = await this.newsletterService.getSubscription(query.subscriptionId);
      if (!dto) throw new NewsletterSubscriptionNotFoundError(query.subscriptionId);
      return dto;
    }

    if (query.email) {
      const dto = await this.newsletterService.getSubscriptionByEmail(query.email);
      if (!dto) throw new NewsletterSubscriptionNotFoundError(query.email);
      return dto;
    }

    throw new DomainValidationError("Either subscriptionId or email must be provided");
  }
}
