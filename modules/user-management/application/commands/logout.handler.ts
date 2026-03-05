import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { LogoutCommand, LogoutResult } from "./logout.command";
import { ITokenBlacklistService } from "../services/itoken-blacklist.service";

export class LogoutHandler implements ICommandHandler<
  LogoutCommand,
  CommandResult<LogoutResult>
> {
  constructor(private readonly tokenBlacklistService: ITokenBlacklistService) {}

  async handle(command: LogoutCommand): Promise<CommandResult<LogoutResult>> {
    try {
      if (command.token) {
        this.tokenBlacklistService.blacklistToken(command.token);
      }

      return CommandResult.success<LogoutResult>({
        action: "logout_complete",
      });
    } catch (error) {
      return CommandResult.failure<LogoutResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
