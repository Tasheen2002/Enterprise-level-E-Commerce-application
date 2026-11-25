import { describe, it, expect, vi } from "vitest";
import { LoginUserHandler, LoginUserCommand } from "@modules/user-management/application/commands/login-user.command";
import { AuthenticationService, LoginOutcome } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("LoginUserHandler", () => {
  it("should successfully log in a user and clear failed attempts", async () => {
    // Arrange: Mock success login outcome and token blacklist service
    const mockOutcome: LoginOutcome = {
      kind: "success",
      authResult: {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
        expiresIn: 3600,
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "customer",
          isGuest: false,
          emailVerified: true,
          phoneVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };

    const mockAuthService = {
      login: vi.fn().mockResolvedValue(mockOutcome),
    } as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      isAccountLocked: vi.fn().mockReturnValue(false),
      clearFailedAttempts: vi.fn(),
      recordFailedAttempt: vi.fn(),
    } as unknown as ITokenBlacklistService;

    const handler = new LoginUserHandler(mockAuthService, mockTokenBlacklistService);

    const command: LoginUserCommand = {
      email: "test@example.com",
      password: "password123",
      rememberMe: true,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    // Act: Invoke login handler
    const result = await handler.handle(command);

    // Assert: Verify successful login and lockout counter resets
    expect(mockTokenBlacklistService.isAccountLocked).toHaveBeenCalledWith("test@example.com|127.0.0.1");
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      rememberMe: true,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    expect(mockTokenBlacklistService.clearFailedAttempts).toHaveBeenCalledWith("test@example.com|127.0.0.1");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockOutcome);
  });

  it("should fail immediately if the account is locked", async () => {
    // Arrange: Mock account as already locked
    const mockAuthService = {} as unknown as AuthenticationService;

    const mockTokenBlacklistService = {
      isAccountLocked: vi.fn().mockReturnValue(true),
    } as unknown as ITokenBlacklistService;

    const handler = new LoginUserHandler(mockAuthService, mockTokenBlacklistService);

    const command: LoginUserCommand = {
      email: "test@example.com",
      password: "password123",
      ipAddress: "127.0.0.1",
    };

    // Act: Invoke login handler
    const result = await handler.handle(command);

    // Assert: Verify 429 lockout response
    expect(result.success).toBe(false);
    expect(result.error).toBe("Account temporarily locked due to multiple failed login attempts");
    expect(result.statusCode).toBe(429);
  });
});
