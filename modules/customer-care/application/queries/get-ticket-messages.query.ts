import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { TicketMessageService } from "../services/ticket-message.service.js";
import { MessageSender } from "../../domain/value-objects/index.js";

export interface GetTicketMessagesQuery extends ICommand {
  ticketId: string;
  sender?: string;
}

export interface TicketMessageResult {
  messageId: string;
  ticketId: string;
  sender: string;
  body: string;
  createdAt: string;
}

export class GetTicketMessagesHandler
  implements ICommandHandler<GetTicketMessagesQuery, CommandResult<TicketMessageResult[]>>
{
  constructor(private readonly messageService: TicketMessageService) {}

  async handle(query: GetTicketMessagesQuery): Promise<CommandResult<TicketMessageResult[]>> {
    try {
      if (!query.ticketId) {
        return CommandResult.failure<TicketMessageResult[]>("Ticket ID is required", ["ticketId"]);
      }

      let messages;
      if (query.sender) {
        messages = await this.messageService.getMessagesBySender(
          MessageSender.fromString(query.sender),
        );
        messages = messages.filter((m) => m.getTicketId() === query.ticketId);
      } else {
        messages = await this.messageService.getMessagesByTicket(query.ticketId);
      }

      const result: TicketMessageResult[] = messages.map((message) => ({
        messageId: message.getMessageId().getValue(),
        ticketId: message.getTicketId(),
        sender: message.getSender().getValue(),
        body: message.getBody(),
        createdAt: message.getCreatedAt().toISOString(),
      }));

      return CommandResult.success<TicketMessageResult[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<TicketMessageResult[]>("Failed to get ticket messages", [
          error.message,
        ]);
      }

      return CommandResult.failure<TicketMessageResult[]>(
        "An unexpected error occurred while getting ticket messages",
      );
    }
  }
}
