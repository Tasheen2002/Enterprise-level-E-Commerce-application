import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodemailerEmailService } from "../../user-management/infra/security/nodemailer-email.adapter";
import { ResendVerificationHandler } from "../../user-management/application/commands/resend-verification.command";
import type { AuthenticationService } from "../../user-management/application/services/authentication.service";
import type { ITokenBlacklistService } from "../../user-management/application/services/itoken-blacklist.service";

const mail = vi.hoisted(() => ({
  createTransport: vi.fn(),
  createTestAccount: vi.fn(),
  sendMail: vi.fn(),
  getTestMessageUrl: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: mail }));
const options = {
  to: "recipient@example.test",
  subject: "Subject",
  text: "Body",
  html: "<p>Body</p>",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SMTP_HOST", "smtp.example.test");
  vi.stubEnv("SMTP_PORT", undefined);
  vi.stubEnv("SMTP_SECURE", undefined);
  vi.stubEnv("SMTP_USER", undefined);
  vi.stubEnv("SMTP_PASS", undefined);
  vi.stubEnv("SMTP_FROM", undefined);
  vi.stubEnv("FRONTEND_URL", undefined);
  vi.stubEnv("ADMIN_APP_URL", undefined);
  mail.createTestAccount.mockResolvedValue({ user: "synthetic-user", pass: "synthetic-password" });
  mail.createTransport.mockReturnValue({ sendMail: mail.sendMail });
  mail.sendMail.mockResolvedValue({ messageId: "message", accepted: [options.to], rejected: [] });
  mail.getTestMessageUrl.mockReturnValue("https://preview.example.test/private-message");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("shared email adapter transport lifecycle", () => {
  it("does not initialize a provider during construction and reuses one SMTP transport", async () => {
    const adapter = new NodemailerEmailService();
    expect(mail.createTransport).not.toHaveBeenCalled();
    await adapter.sendEmail(options);
    await adapter.sendEmail(options);
    expect(mail.createTransport).toHaveBeenCalledTimes(1);
    expect(mail.createTestAccount).not.toHaveBeenCalled();
    expect(mail.sendMail).toHaveBeenCalledWith({
      ...options,
      from: '"Slipperze Boutique" <concierge@slipperze.com>',
    });
  });
  it("forwards configured SMTP settings and sender", async () => {
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_SECURE", "true");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASS", "password");
    vi.stubEnv("SMTP_FROM", "sender@example.test");
    await new NodemailerEmailService().sendEmail(options);
    expect(mail.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.test",
        port: 465,
        secure: true,
        auth: { user: "user", pass: "password" },
      }),
    );
    expect(mail.sendMail.mock.calls[0][0].from).toBe('"Slipperze Boutique" <sender@example.test>');
  });
  it.each(["production", "test", "development"])(
    "rejects delivery failures in %s",
    async (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      const failure = new Error("Synthetic delivery failure");
      mail.sendMail.mockRejectedValue(failure);
      await expect(new NodemailerEmailService().sendEmail(options)).rejects.toBe(failure);
      expect(console.warn).not.toHaveBeenCalled();
    },
  );
  it("shares first-use development initialization across concurrent sends", async () => {
    vi.stubEnv("NODE_ENV", "development");
    let release!: (account: { user: string; pass: string }) => void;
    mail.createTestAccount.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const adapter = new NodemailerEmailService();
    const sends = [
      adapter.sendEmail(options),
      adapter.sendEmail(options),
      adapter.sendEmail(options),
    ];
    release({ user: "synthetic-user", pass: "synthetic-password" });
    await Promise.all(sends);
    expect(mail.createTestAccount).toHaveBeenCalledTimes(1);
    expect(mail.createTransport).toHaveBeenCalledTimes(1);
    expect(mail.sendMail).toHaveBeenCalledTimes(3);
  });
  it("shares an initialization failure then allows a new attempt", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const failure = new Error("Synthetic initialization failure");
    mail.createTestAccount.mockRejectedValueOnce(failure);
    const adapter = new NodemailerEmailService();
    const results = await Promise.allSettled([
      adapter.sendEmail(options),
      adapter.sendEmail(options),
    ]);
    expect(results).toEqual([
      { status: "rejected", reason: failure },
      { status: "rejected", reason: failure },
    ]);
    expect(mail.createTestAccount).toHaveBeenCalledTimes(1);
    await adapter.sendEmail(options);
    expect(mail.createTestAccount).toHaveBeenCalledTimes(2);
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
  });
  it("retries transport construction after a synchronous constructor failure", async () => {
    mail.createTransport.mockImplementationOnce(() => {
      throw new Error("Synthetic construction failure");
    });
    const adapter = new NodemailerEmailService();
    await expect(adapter.sendEmail(options)).rejects.toThrow("Synthetic construction failure");
    await adapter.sendEmail(options);
    expect(mail.createTransport).toHaveBeenCalledTimes(2);
  });
  it("keeps a delivery failure observable without automatically resending", async () => {
    mail.sendMail.mockRejectedValueOnce(new Error("Synthetic submission failure"));
    const adapter = new NodemailerEmailService();
    await expect(adapter.sendEmail(options)).rejects.toThrow("Synthetic submission failure");
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    await adapter.sendEmail(options);
    expect(mail.createTransport).toHaveBeenCalledTimes(1);
  });
  it("permits transports without SMTP recipient metadata", async () => {
    mail.sendMail.mockResolvedValue({ messageId: "message" });
    await expect(new NodemailerEmailService().sendEmail(options)).resolves.toBeUndefined();
  });
  it("rejects a partial recipient rejection rather than reporting complete submission", async () => {
    mail.sendMail.mockResolvedValue({ accepted: [options.to], rejected: ["other@example.test"] });
    await expect(new NodemailerEmailService().sendEmail(options)).rejects.toThrow(
      "Email submission was rejected for one or more recipients",
    );
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
  });
  it.each([undefined, "", " "])(
    "rejects an absent SMTP host (%s) before constructing a transport",
    async (host) => {
      vi.stubEnv("SMTP_HOST", host);
      await expect(new NodemailerEmailService().sendEmail(options)).rejects.toThrow(
        "SMTP host is not configured",
      );
      expect(mail.createTransport).not.toHaveBeenCalled();
    },
  );
});

describe("email template boundaries", () => {
  it.each(["reset", "verification", "invitation", "welcome"] as const)(
    "does not log %s messages or preview URLs in development",
    async (kind) => {
      vi.stubEnv("NODE_ENV", "development");
      const adapter = new NodemailerEmailService();
      if (kind === "reset") await adapter.sendPasswordResetEmail(options.to, "synthetic-secret");
      if (kind === "verification")
        await adapter.sendVerificationEmail(options.to, "synthetic-secret");
      if (kind === "invitation")
        await adapter.sendInvitationEmail(
          options.to,
          "https://admin.example.test/setup-account?token=synthetic-secret",
          "Admin",
        );
      if (kind === "welcome") await adapter.sendVerificationEmail(options.to, "WELCOME_ADMIN");
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(mail.getTestMessageUrl).not.toHaveBeenCalled();
    },
  );
  it.each(["reset", "verification"] as const)(
    "uses the primary frontend origin and encoded token for %s",
    async (kind) => {
      vi.stubEnv(
        "FRONTEND_URL",
        " https://shop.example.test/ignored?query=ignored,https://admin.example.test ",
      );
      const adapter = new NodemailerEmailService();
      const token = 'synthetic&token="<x>';
      if (kind === "reset") await adapter.sendPasswordResetEmail(options.to, token);
      else await adapter.sendVerificationEmail(options.to, token);
      const path = kind === "reset" ? "reset-password" : "verify-email";
      const link = `https://shop.example.test/${path}?token=${encodeURIComponent(token)}`;
      expect(mail.sendMail.mock.calls[0][0].text).toContain(link);
    },
  );
  it("retains default frontend links and admin welcome without a security token", async () => {
    const adapter = new NodemailerEmailService();
    await adapter.sendPasswordResetEmail(options.to, "token");
    await adapter.sendVerificationEmail(options.to, "token");
    await adapter.sendVerificationEmail(options.to, "WELCOME_ADMIN");
    expect(mail.sendMail.mock.calls[0][0].text).toContain(
      "http://localhost:3000/reset-password?token=token",
    );
    expect(mail.sendMail.mock.calls[1][0].text).toContain(
      "http://localhost:3000/verify-email?token=token",
    );
    expect(mail.sendMail.mock.calls[2][0].html).toContain('href="http://localhost:3002/login"');
    expect(mail.sendMail.mock.calls[2][0].html).not.toContain("WELCOME_ADMIN");
  });
  it("normalizes the admin welcome origin and escapes invitation HTML values", async () => {
    vi.stubEnv("ADMIN_APP_URL", "https://admin.example.test/");
    const adapter = new NodemailerEmailService();
    await adapter.sendVerificationEmail(options.to, "WELCOME_ADMIN");
    expect(mail.sendMail.mock.calls[0][0].html).toContain(
      'href="https://admin.example.test/login"',
    );
    await adapter.sendInvitationEmail(
      options.to,
      "https://admin.example.test/setup?token=abc&next=home",
      "&<>\"'",
    );
    const message = mail.sendMail.mock.calls[1][0];
    expect(message.html).toContain("&amp;&lt;&gt;&quot;&#39;");
    expect(message.html).toContain("token=abc&amp;next=home");
    expect(message.text).toContain("token=abc&next=home");
  });
  it.each([
    "javascript:alert(1)",
    "file:///private",
    "not a url",
    "https://user@example.test/path",
    "https://:password@example.test/path",
  ])("rejects unsupported invitation URLs: %s", async (url) => {
    await expect(
      new NodemailerEmailService().sendInvitationEmail(options.to, url, "Admin"),
    ).rejects.toThrow();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
});

describe("email failure at an actual command boundary", () => {
  it("keeps a development failure observable to the resend command caller", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const failure = new Error("Synthetic provider failure");
    mail.sendMail.mockRejectedValue(failure);
    const auth = {
      resendEmailVerification: vi.fn().mockResolvedValue({
        alreadyVerified: false,
        userId: "user",
        verificationToken: "synthetic-token",
      }),
    } as unknown as AuthenticationService;
    const tokens = { storeVerificationToken: vi.fn() } as unknown as ITokenBlacklistService;
    const handler = new ResendVerificationHandler(auth, tokens, new NodemailerEmailService());
    await expect(handler.handle({ email: options.to })).rejects.toBe(failure);
    expect(tokens.storeVerificationToken).toHaveBeenCalledWith(
      "synthetic-token",
      "user",
      options.to,
    );
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
  });
  it("does not contact a transport for an already verified user", async () => {
    const auth = {
      resendEmailVerification: vi.fn().mockResolvedValue({ alreadyVerified: true }),
    } as unknown as AuthenticationService;
    const handler = new ResendVerificationHandler(
      auth,
      {} as ITokenBlacklistService,
      new NodemailerEmailService(),
    );
    await expect(handler.handle({ email: options.to })).resolves.toMatchObject({ success: true });
    expect(mail.createTransport).not.toHaveBeenCalled();
  });
});
