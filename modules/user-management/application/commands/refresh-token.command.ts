import {
  AuthenticationService,
  RefreshTokenResult,
} from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface RefreshTokenInput extends ICommand {
  refreshToken: string;
  currentAccessToken?: string;
}

export class RefreshTokenHandler
  implements
    ICommandHandler<RefreshTokenInput, CommandResult<RefreshTokenResult>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async handle(
    input: RefreshTokenInput
  ): Promise<CommandResult<RefreshTokenResult>> {
    // Check if the refresh token has been revoked
    if (this.tokenBlacklistService.isTokenBlacklisted(input.refreshToken)) {
      return CommandResult.failure('Token has been revoked');
    }

    // Blacklist the current access token if provided (token rotation)
    if (input.currentAccessToken) {
      this.tokenBlacklistService.blacklistToken(input.currentAccessToken);
    }

    // Generate new tokens
    const tokens = await this.authService.refreshToken(input.refreshToken);

    // Blacklist the old refresh token (one-time use)
    this.tokenBlacklistService.blacklistToken(input.refreshToken);

    return CommandResult.success(tokens);
  }
}
