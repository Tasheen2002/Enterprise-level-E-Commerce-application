import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportTicketService } from "../services/support-ticket.service.js";

export interface AssignSupportAgentCommand extends ICommand {
  ticketId: string;
  agentId: string;
}

export class AssignSupportAgentHandler
  implements ICommandHandler<AssignSupportAgentCommand, CommandResult<void>>
{
  constructor(private readonly ticketService: SupportTicketService) {}

  async handle(command: AssignSupportAgentCommand): Promise<CommandResult<void>> {
    try {
      if (!command.ticketId) {
        return CommandResult.failure<void>("Ticket ID is required", ["ticketId"]);
      }
      if (!command.agentId) {
        return CommandResult.failure<void>("Agent ID is required", ["agentId"]);
      }
      // This assumes you have a method to assign an agent in your service/entity
      // If not, you should implement it accordingly
      // Example:
      // await this.ticketService.assignAgent(command.ticketId, command.agentId);
      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to assign support agent", [error.message]);
      }
      return CommandResult.failure<void>(
        "An unexpected error occurred while assigning support agent",
      );
    }
  }
}
