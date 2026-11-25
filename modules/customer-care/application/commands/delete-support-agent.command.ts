import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { SupportAgentService } from "../services/support-agent.service.js";

export interface DeleteSupportAgentCommand extends ICommand {
  agentId: string;
}

export class DeleteSupportAgentHandler
  implements ICommandHandler<DeleteSupportAgentCommand, CommandResult<void>>
{
  constructor(private readonly agentService: SupportAgentService) {}

  async handle(command: DeleteSupportAgentCommand): Promise<CommandResult<void>> {
    try {
      if (!command.agentId) {
        return CommandResult.failure<void>("Agent ID is required", ["agentId"]);
      }

      await this.agentService.deleteAgent(command.agentId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete support agent", [error.message]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting support agent",
      );
    }
  }
}
