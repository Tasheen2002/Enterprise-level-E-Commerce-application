import {
  AuthenticationService,
  RefreshTokenResult,
} from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface RefreshTokenCommand extends ICommand {
  readonly refreshToken: string;
  readonly currentAccessToken?: string;
}

export class RefreshTokenHandler
  implements
    ICommandHandler<RefreshTokenCommand, CommandResult<RefreshTokenResult>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(
    command: RefreshTokenCommand
  ): Promise<CommandResult<RefreshTokenResult>> {
    // Check if the refresh token has been revoked
    if (this.tokenBlacklistService.isTokenBlacklisted(command.refreshToken)) {
      return CommandResult.failure('Token has been revoked');
    }

    // Blacklist the current access token if provided (token rotation)
    if (command.currentAccessToken) {
      this.tokenBlacklistService.blacklistToken(command.currentAccessToken);
    }

    // Generate new tokens
    const tokens = await this.authService.refreshToken(command.refreshToken);

    // Blacklist the old refresh token (one-time use)
    this.tokenBlacklistService.blacklistToken(command.refreshToken);

    return CommandResult.success(tokens);
  }
}
