import { TicketMessageService } from "../services/ticket-message.service.js";
import { MessageSender } from "../../domain/value-objects/index.js";

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
  implements
    ICommandHandler<
      GetTicketMessagesQuery,
      CommandResult<TicketMessageResult[]>
    >
{
  constructor(private readonly messageService: TicketMessageService) {}

  async handle(
    query: GetTicketMessagesQuery
  ): Promise<CommandResult<TicketMessageResult[]>> {
    try {
      if (!query.ticketId) {
        return CommandResult.failure<TicketMessageResult[]>(
          "Ticket ID is required",
          ["ticketId"]
        );
      }

      let messages;
      if (query.sender) {
        messages = await this.messageService.getMessagesBySender(
          MessageSender.fromString(query.sender)
        );
        messages = messages.filter((m) => m.getTicketId() === query.ticketId);
      } else {
        messages = await this.messageService.getMessagesByTicket(
          query.ticketId
        );
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
        return CommandResult.failure<TicketMessageResult[]>(
          "Failed to get ticket messages",
          [error.message]
        );
      }

      return CommandResult.failure<TicketMessageResult[]>(
        "An unexpected error occurred while getting ticket messages"
      );
    }
  }
}
