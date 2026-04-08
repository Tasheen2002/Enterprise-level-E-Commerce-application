import { ICommand } from "@/api/src/shared/application";

export interface RefreshTokenCommand extends ICommand {
  refreshToken: string;
  currentAccessToken?: string;
}

export interface RefreshTokenCommandResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}
