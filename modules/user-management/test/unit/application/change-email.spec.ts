import { describe, it, expect, vi } from "vitest";
import { ChangeEmailHandler, ChangeEmailCommand } from "@modules/user-management/application/commands/change-email.command";
import { AuthenticationService } from "@modules/user-management/application/services/authentication.service";
import { ITokenBlacklistService } from "@modules/user-management/application/services/itoken-blacklist.service";
import { IEmailService } from "@modules/user-management/application/services/iemail.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("ChangeEmailHandler", () => {
  const command: ChangeEmailCommand = {
    userId: "user-123",
    newEmail: "new-email@example.com",
    password: "secure-password",
  };

  function harness(notify = vi.fn().mockResolvedValue(undefined)) {
    const authService = {
      requestEmailChange: vi.fn().mockResolvedValue({
        verificationToken: "token-abc",
        currentEmail: "old@example.com",
        newEmail: "new-email@example.com",
      }),
    } as unknown as AuthenticationService;
    const tokens = { storeVerificationToken: vi.fn() } as unknown as ITokenBlacklistService;
    const email = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
      sendEmail: notify,
    } as unknown as IEmailService;
    return { handler: new ChangeEmailHandler(authService, tokens, email), authService, tokens, email };
  }

  it("sends a confirmation link to the new address instead of changing the email", async () => {
    const h = harness();
    const result = await h.handler.handle(command);

    expect(h.authService.requestEmailChange).toHaveBeenCalledWith(
      "user-123",
      "new-email@example.com",
      "secure-password",
    );
    expect(h.tokens.storeVerificationToken).toHaveBeenCalledWith(
      "token-abc",
      "user-123",
      "new-email@example.com",
    );
    expect(h.email.sendVerificationEmail).toHaveBeenCalledWith("new-email@example.com", "token-abc");
    expect(h.email.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "old@example.com" }),
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });

  it("still succeeds when the notice to the current address cannot be sent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const h = harness(vi.fn().mockRejectedValue(new Error("smtp down")));
    expect((await h.handler.handle(command)).success).toBe(true);
  });
});
