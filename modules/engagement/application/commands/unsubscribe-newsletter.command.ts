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

export interface UnsubscribeNewsletterCommand extends ICommand {
  subscriptionId?: string;
  email?: string;
}

export class UnsubscribeNewsletterHandler
  implements ICommandHandler<UnsubscribeNewsletterCommand, CommandResult<void>>
{
  constructor(
    private readonly newsletterService: NewsletterService
  ) {}

  async handle(
    command: UnsubscribeNewsletterCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.subscriptionId && !command.email) {
        return CommandResult.failure<void>(
          "Either subscription ID or email is required",
          ["subscriptionId", "email"]
        );
      }

      if (command.subscriptionId) {
        await this.newsletterService.unsubscribe(command.subscriptionId);
      } else if (command.email) {
        await this.newsletterService.unsubscribeByEmail(command.email);
      }

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to unsubscribe from newsletter",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while unsubscribing from newsletter"
      );
    }
  }
}
