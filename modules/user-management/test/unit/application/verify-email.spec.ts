import { describe, it, expect, vi } from "vitest";
import { VerifyEmailHandler, VerifyEmailCommand } from "@modules/user-management/application/commands/verify-email.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { InvalidVerificationTokenError } from "@modules/user-management/domain/errors/user-management.errors";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("VerifyEmailHandler", () => {
  it("should successfully verify email when verification token is valid", async () => {
    // Arrange
    const mockTokenData = {
      userId: "user-123",
      email: "test@example.com",
    };

    const mockAuthService = {
      verifyEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      getVerificationToken: vi.fn().mockReturnValue(mockTokenData),
    } as unknown as ITokenBlacklistService;

    const handler = new VerifyEmailHandler(mockAuthService, mockTokenBlacklistService);

    const command: VerifyEmailCommand = {
      token: "valid-verify-token",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockTokenBlacklistService.getVerificationToken).toHaveBeenCalledWith("valid-verify-token");
    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith("user-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });

  it("should throw InvalidVerificationTokenError when verification token is invalid", async () => {
    // Arrange
    const mockAuthService = {
      verifyEmail: vi.fn(),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      getVerificationToken: vi.fn().mockReturnValue(null),
    } as unknown as ITokenBlacklistService;

    const handler = new VerifyEmailHandler(mockAuthService, mockTokenBlacklistService);

    const command: VerifyEmailCommand = {
      token: "invalid-verify-token",
    };

    // Act & Assert
    await expect(handler.handle(command)).rejects.toThrow(InvalidVerificationTokenError);
    expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
  });
});
