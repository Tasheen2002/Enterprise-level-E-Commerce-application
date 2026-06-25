import { describe, it, expect, vi } from "vitest";
import { ChangeEmailHandler, ChangeEmailCommand } from "@modules/user-management/application/commands/change-email.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("ChangeEmailHandler", () => {
  it("should change user email using AuthenticationService", async () => {
    // Arrange
    const mockAuthService = {
      changeEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticationService;

    const handler = new ChangeEmailHandler(mockAuthService);

    const command: ChangeEmailCommand = {
      userId: "user-123",
      newEmail: "new-email@example.com",
      password: "secure-password",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockAuthService.changeEmail).toHaveBeenCalledWith(
      "user-123",
      "new-email@example.com",
      "secure-password"
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });
});
