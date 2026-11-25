import { describe, it, expect, vi } from "vitest";
import { InitiatePasswordResetHandler, InitiatePasswordResetCommand } from "@modules/user-management/application/commands/initiate-password-reset.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { IEmailService } from "@modules/user-management/application/services/iemail.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("InitiatePasswordResetHandler", () => {
  it("should successfully initiate password reset when user exists", async () => {
    // Arrange
    const mockAuthResult = {
      exists: true,
      resetToken: "reset-token-123",
      userId: "user-123",
    };

    const mockAuthService = {
      initiatePasswordReset: vi.fn().mockResolvedValue(mockAuthResult),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      storePasswordResetToken: vi.fn(),
    } as unknown as ITokenBlacklistService;

    const mockEmailService = {
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as IEmailService;

    const handler = new InitiatePasswordResetHandler(
      mockAuthService,
      mockTokenBlacklistService,
      mockEmailService
    );

    const command: InitiatePasswordResetCommand = {
      email: "test@example.com",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockAuthService.initiatePasswordReset).toHaveBeenCalledWith("test@example.com");
    expect(mockTokenBlacklistService.storePasswordResetToken).toHaveBeenCalledWith(
      "reset-token-123",
      "user-123",
      "test@example.com"
    );
    expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "test@example.com",
      "reset-token-123"
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ exists: true });
  });

  it("should not store token or send email if user does not exist", async () => {
    // Arrange
    const mockAuthResult = {
      exists: false,
    };

    const mockAuthService = {
      initiatePasswordReset: vi.fn().mockResolvedValue(mockAuthResult),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      storePasswordResetToken: vi.fn(),
    } as unknown as ITokenBlacklistService;

    const mockEmailService = {
      sendPasswordResetEmail: vi.fn(),
    } as unknown as IEmailService;

    const handler = new InitiatePasswordResetHandler(
      mockAuthService,
      mockTokenBlacklistService,
      mockEmailService
    );

    const command: InitiatePasswordResetCommand = {
      email: "notfound@example.com",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockAuthService.initiatePasswordReset).toHaveBeenCalledWith("notfound@example.com");
    expect(mockTokenBlacklistService.storePasswordResetToken).not.toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ exists: false });
  });
});
