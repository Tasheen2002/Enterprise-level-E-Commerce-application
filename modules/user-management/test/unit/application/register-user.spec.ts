import { describe, it, expect, vi } from "vitest";
import { RegisterUserHandler, RegisterUserCommand } from "@modules/user-management/application/commands/register-user.command";
import { AuthenticationService, AuthResult } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { IEmailService } from "@modules/user-management/application/services/iemail.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("RegisterUserHandler", () => {
  it("should successfully register a user and trigger email verification", async () => {
    // Arrange: Mock the responses for auth registration and email verification
    const mockAuthResult: AuthResult = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
      expiresIn: 3600,
      user: {
        id: "user-123",
        email: "test@example.com",
        role: "customer",
        isGuest: false,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const mockVerificationResult = {
      alreadyVerified: false,
      verificationToken: "verify-token-123",
      userId: "user-123",
    };

    const mockAuthService = {
      register: vi.fn().mockResolvedValue(mockAuthResult),
      resendEmailVerification: vi.fn().mockResolvedValue(mockVerificationResult),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      storeVerificationToken: vi.fn(),
    } as unknown as ITokenBlacklistService;

    const mockEmailService = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as IEmailService;

    const handler = new RegisterUserHandler(
      mockAuthService,
      mockTokenBlacklistService,
      mockEmailService
    );

    const command: RegisterUserCommand = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    // Act: Handle the register command
    const result = await handler.handle(command);

    // Assert: Verify registration success
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: undefined,
      role: undefined,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockAuthResult);

    // Give background verification promise time to execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Assert: Verify verification background calls
    expect(mockAuthService.resendEmailVerification).toHaveBeenCalledWith("test@example.com");
    expect(mockTokenBlacklistService.storeVerificationToken).toHaveBeenCalledWith(
      "verify-token-123",
      "user-123",
      "test@example.com"
    );
    expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
      "test@example.com",
      "verify-token-123"
    );
  });
});
