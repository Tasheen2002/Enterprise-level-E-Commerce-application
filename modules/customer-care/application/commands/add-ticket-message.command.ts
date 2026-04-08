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

export interface AddTicketMessageCommand extends ICommand {
  ticketId: string;
  sender: string;
  message: string;
}

export interface TicketMessageResult {
  messageId: string;
  ticketId: string;
  sender: string;
  body: string;
  createdAt: string;
}

export class AddTicketMessageHandler
  implements
    ICommandHandler<AddTicketMessageCommand, CommandResult<TicketMessageResult>>
{
  constructor(private readonly messageService: TicketMessageService) {}

  async handle(
    command: AddTicketMessageCommand
  ): Promise<CommandResult<TicketMessageResult>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<TicketMessageResult>(
          "Ticket ID is required",
          ["ticketId"]
        );
      }

      if (!command.sender) {
        return CommandResult.failure<TicketMessageResult>(
          "Sender is required",
          ["sender"]
        );
      }

      if (!command.message || command.message.trim().length === 0) {
        return CommandResult.failure<TicketMessageResult>(
          "Message is required",
          ["message"]
        );
      }

      const message = await this.messageService.createMessage({
        ticketId: command.ticketId,
        sender: MessageSender.fromString(command.sender),
        body: command.message,
      });

      const result: TicketMessageResult = {
        messageId: message.getMessageId().getValue(),
        ticketId: message.getTicketId(),
        sender: message.getSender().getValue(),
        body: message.getBody(),
        createdAt: message.getCreatedAt().toISOString(),
      };

      return CommandResult.success<TicketMessageResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<TicketMessageResult>(
          "Failed to add ticket message",
          [error.message]
        );
      }

      return CommandResult.failure<TicketMessageResult>(
        "An unexpected error occurred while adding ticket message"
      );
    }
  }
}
