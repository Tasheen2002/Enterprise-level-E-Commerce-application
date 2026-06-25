import { describe, it, expect, vi } from "vitest";
import { ChangePasswordHandler, ChangePasswordCommand } from "@modules/user-management/application/commands/change-password.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("ChangePasswordHandler", () => {
  it("should successfully change a password using AuthenticationService", async () => {
    // Arrange
    const mockAuthService = {
      changePassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticationService;

    const handler = new ChangePasswordHandler(mockAuthService);

    const command: ChangePasswordCommand = {
      userId: "user-123",
      currentPassword: "old-password",
      newPassword: "new-password",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockAuthService.changePassword).toHaveBeenCalledWith(
      "user-123",
      "old-password",
      "new-password"
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });
});
