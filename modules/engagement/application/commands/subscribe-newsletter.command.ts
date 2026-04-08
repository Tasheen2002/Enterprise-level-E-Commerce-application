import { NewsletterService } from "../services/newsletter.service.js";

export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

export interface SubscribeNewsletterCommand extends ICommand {
  email: string;
  source?: string;
}

export interface NewsletterSubscriptionResult {
  subscriptionId: string;
  email: string;
  status: string;
  source?: string;
  createdAt: Date;
}

export class SubscribeNewsletterHandler
  implements ICommandHandler<SubscribeNewsletterCommand, CommandResult<NewsletterSubscriptionResult>>
{
  constructor(
    private readonly newsletterService: NewsletterService
  ) {}

  async handle(
    command: SubscribeNewsletterCommand
  ): Promise<CommandResult<NewsletterSubscriptionResult>> {
    try {
      if (!command.email || command.email.trim().length === 0) {
        return CommandResult.failure<NewsletterSubscriptionResult>(
          "Email is required",
          ["email"]
        );
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(command.email)) {
        return CommandResult.failure<NewsletterSubscriptionResult>(
          "Invalid email format",
          ["email"]
        );
      }

      const subscription = await this.newsletterService.subscribe(
        command.email,
        command.source
      );

      const result: NewsletterSubscriptionResult = {
        subscriptionId: subscription.getSubscriptionId().getValue(),
        email: subscription.getEmail(),
        status: subscription.getStatus().getValue(),
        source: subscription.getSource(),
        createdAt: subscription.getCreatedAt(),
      };

      return CommandResult.success<NewsletterSubscriptionResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<NewsletterSubscriptionResult>(
          "Failed to subscribe to newsletter",
          [error.message]
        );
      }

      return CommandResult.failure<NewsletterSubscriptionResult>(
        "An unexpected error occurred while subscribing to newsletter"
      );
    }
  }
}
