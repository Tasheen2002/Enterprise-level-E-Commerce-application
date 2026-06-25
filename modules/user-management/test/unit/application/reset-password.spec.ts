import { describe, it, expect, vi } from "vitest";
import { ResetPasswordHandler, ResetPasswordCommand } from "@modules/user-management/application/commands/reset-password.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { DomainValidationError } from "@modules/user-management/domain/errors/user-management.errors";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("ResetPasswordHandler", () => {
  it("should successfully reset password when token is valid", async () => {
    // Arrange
    const mockTokenData = {
      userId: "user-123",
      email: "test@example.com",
    };

    const mockAuthService = {
      resetPassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      getPasswordResetToken: vi.fn().mockReturnValue(mockTokenData),
    } as unknown as ITokenBlacklistService;

    const handler = new ResetPasswordHandler(mockAuthService, mockTokenBlacklistService);

    const command: ResetPasswordCommand = {
      token: "valid-token-123",
      newPassword: "new-secure-password",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockTokenBlacklistService.getPasswordResetToken).toHaveBeenCalledWith("valid-token-123");
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith("test@example.com", "new-secure-password");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });

  it("should throw DomainValidationError when token is invalid or expired", async () => {
    // Arrange
    const mockAuthService = {
      resetPassword: vi.fn(),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      getPasswordResetToken: vi.fn().mockReturnValue(null),
    } as unknown as ITokenBlacklistService;

    const handler = new ResetPasswordHandler(mockAuthService, mockTokenBlacklistService);

    const command: ResetPasswordCommand = {
      token: "expired-token-123",
      newPassword: "new-secure-password",
    };

    // Act & Assert
    await expect(handler.handle(command)).rejects.toThrow(DomainValidationError);
    await expect(handler.handle(command)).rejects.toThrow("Invalid or expired reset token");
    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });
});
