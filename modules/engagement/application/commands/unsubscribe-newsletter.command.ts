import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { NewsletterService } from "../services/newsletter.service";

export interface UnsubscribeNewsletterCommand extends ICommand {
  readonly subscriptionId?: string;
  readonly email?: string;
}

export class UnsubscribeNewsletterHandler
  implements ICommandHandler<UnsubscribeNewsletterCommand, CommandResult<void>>
{
  constructor(private readonly newsletterService: NewsletterService) {}

  async handle(command: UnsubscribeNewsletterCommand): Promise<CommandResult<void>> {
    if (command.subscriptionId) {
      await this.newsletterService.unsubscribe(command.subscriptionId);
    } else if (command.email) {
      await this.newsletterService.unsubscribeByEmail(command.email);
    } else {
      return CommandResult.failure("Either subscriptionId or email must be provided");
    }
    return CommandResult.success();
  }
}
