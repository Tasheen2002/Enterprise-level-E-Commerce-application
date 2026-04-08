import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import {
  RefreshTokenCommand,
  RefreshTokenCommandResult,
} from "./refresh-token.command";
import { AuthenticationService } from "../../services/authentication.service";
import { ITokenBlacklistService } from "../../services/itoken-blacklist.service";

export class RefreshTokenHandler implements ICommandHandler<
  RefreshTokenCommand,
  CommandResult<RefreshTokenCommandResult>
> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(
    command: RefreshTokenCommand,
  ): Promise<CommandResult<RefreshTokenCommandResult>> {
    try {
      // Check if the refresh token has been revoked
      if (this.tokenBlacklistService.isTokenBlacklisted(command.refreshToken)) {
        return CommandResult.failure<RefreshTokenCommandResult>(
          "Token has been revoked",
        );
      }

      // Blacklist the current access token if provided (token rotation)
      if (command.currentAccessToken) {
        this.tokenBlacklistService.blacklistToken(command.currentAccessToken);
      }

      // Generate new tokens
      const tokens = await this.authService.refreshToken(command.refreshToken);

      // Blacklist the old refresh token (one-time use)
      this.tokenBlacklistService.blacklistToken(command.refreshToken);

      return CommandResult.success<RefreshTokenCommandResult>({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: "Bearer",
      });
    } catch (error) {
      return CommandResult.failure<RefreshTokenCommandResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
