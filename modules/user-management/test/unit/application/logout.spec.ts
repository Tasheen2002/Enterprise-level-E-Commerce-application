import { describe, it, expect, vi } from "vitest";
import { LogoutHandler, LogoutCommand } from "@modules/user-management/application/commands/logout.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("LogoutHandler", () => {
  it("should successfully log out a user and blacklist tokens", async () => {
    // Arrange
    const mockAuthService = {
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      blacklistToken: vi.fn(),
    } as unknown as ITokenBlacklistService;

    const handler = new LogoutHandler(mockAuthService, mockTokenBlacklistService);

    const command: LogoutCommand = {
      userId: "user-123",
      token: "access-token-123",
      refreshToken: "refresh-token-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockAuthService.logout).toHaveBeenCalledWith("user-123", "access-token-123", "refresh-token-123");
    expect(mockTokenBlacklistService.blacklistToken).toHaveBeenCalledWith("access-token-123");
    expect(mockTokenBlacklistService.blacklistToken).toHaveBeenCalledWith("refresh-token-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });

  it("should log out successfully without blacklisting if no tokens are provided", async () => {
    // Arrange
    const mockAuthService = {
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      blacklistToken: vi.fn(),
    } as unknown as ITokenBlacklistService;

    const handler = new LogoutHandler(mockAuthService, mockTokenBlacklistService);

    const command: LogoutCommand = {
      userId: "user-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockAuthService.logout).toHaveBeenCalledWith("user-123", undefined, undefined);
    expect(mockTokenBlacklistService.blacklistToken).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
