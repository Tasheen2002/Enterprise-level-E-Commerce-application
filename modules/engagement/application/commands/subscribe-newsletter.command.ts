import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { NewsletterService } from "../services/newsletter.service";
import { SubscriptionDTO } from "../../domain/entities/newsletter-subscription.entity";

export interface SubscribeNewsletterCommand extends ICommand {
  readonly email: string;
  readonly source?: string;
}

export class SubscribeNewsletterHandler
  implements ICommandHandler<SubscribeNewsletterCommand, CommandResult<SubscriptionDTO>>
{
  constructor(private readonly newsletterService: NewsletterService) {}

  async handle(command: SubscribeNewsletterCommand): Promise<CommandResult<SubscriptionDTO>> {
    const dto = await this.newsletterService.subscribe(command.email, command.source);
    return CommandResult.success(dto);
  }
}
