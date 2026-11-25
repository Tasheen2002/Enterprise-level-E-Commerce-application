import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { AuthenticationService } from "../../../application/services/authentication.service";
import { Verify2FALoginHandler } from "../../../application/commands/verify-2fa-login.command";
import { LoginUserHandler } from "../../../application/commands/login-user.command";
import { JwtService } from "../../../infra/http/security/jwt.service";
import { TokenBlacklistService } from "../../../infra/http/security/token-blacklist";
import { BcryptPasswordHasherAdapter } from "../../../infra/security/bcrypt-password-hasher.adapter";
import { User } from "../../../domain/entities/user.entity";
import { MemberSession } from "../../../domain/entities/member-session.entity";
import { UserStatus } from "../../../domain/value-objects/user-status.vo";
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UserInactiveError,
} from "../../../domain/errors/user-management.errors";
import crypto from "crypto";

const jwt = new JwtService({
  accessTokenSecret: "synthetic-access-secret-at-least-32-bytes!!",
  refreshTokenSecret: "synthetic-refresh-secret-at-least-32-bytes!",
});
const hasher = new BcryptPasswordHasherAdapter(4);
const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

function harness(user: User | null) {
  const users = {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    save: vi.fn(),
  };
  const sessions = {
    create: vi.fn(),
    update: vi.fn(),
    findByTokenHash: vi.fn(),
    revokeAllForUser: vi.fn(),
  };
  const service = new AuthenticationService(
    users as never,
    hasher,
    jwt,
    {} as never,
    {} as never,
    {} as never,
    sessions as never,
  );
  return { service, users, sessions };
}

const customer = async (password = "Valid#Pass1") =>
  User.create({
    email: `user-${randomUUID()}@example.test`,
    passwordHash: (await hasher.hash(password)) as string,
  });

describe("Google sign-in only trusts provider-verified email addresses", () => {
  it("refuses an unverified address that matches an existing account", async () => {
    const existing = await customer();
    const h = harness(existing);
    await expect(
      h.service.loginWithGoogle({
        email: existing.email.getValue(),
        emailVerified: false,
        name: null,
      }),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
    expect(h.sessions.create).not.toHaveBeenCalled();
  });

  it("refuses to create an account from an unverified address", async () => {
    const h = harness(null);
    await expect(
      h.service.loginWithGoogle({ email: "new@example.test", emailVerified: false, name: "New" }),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
    expect(h.users.save).not.toHaveBeenCalled();
  });

  it("still signs in a verified address", async () => {
    const existing = await customer();
    const h = harness(existing);
    await h.service.loginWithGoogle({
      email: existing.email.getValue(),
      emailVerified: true,
      name: null,
    });
    expect(h.sessions.create).toHaveBeenCalledOnce();
  });
});

describe("password changes end other sessions", () => {
  it("change-password revokes every session except the current one", async () => {
    const user = await customer("Old#Pass1x");
    const h = harness(user);
    await h.service.changePassword(
      user.id.getValue(),
      "Old#Pass1x",
      "New#Pass2y",
      "current-session",
    );
    expect(h.sessions.revokeAllForUser).toHaveBeenCalledWith(user.id, "current-session");
  });

  it("reset-password targets the account by id and revokes all of its sessions", async () => {
    const user = await customer();
    const h = harness(user);
    await h.service.resetPassword(user.id.getValue(), "Reset#Pass3z");
    expect(h.users.findById).toHaveBeenCalled();
    expect(h.users.findByEmail).not.toHaveBeenCalled();
    expect(h.sessions.revokeAllForUser).toHaveBeenCalledWith(user.id);
  });
});

describe("refresh keeps the session lifetime chosen at sign-in", () => {
  const sessionFor = (user: User, refreshToken: string) =>
    MemberSession.create({
      id: randomUUID(),
      userId: user.id,
      refreshTokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + 86_400_000),
    });
  const tokenFor = (user: User, sessionId: string, rememberMe: boolean) =>
    jwt.signRefresh(
      { userId: user.id.getValue(), email: user.email.getValue(), role: user.role, sessionId },
      rememberMe,
    );
  const days = (token: string) => {
    const { iat, exp } = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
    return Math.round((exp - iat) / 86_400);
  };

  it.each([
    [false, 7],
    [true, 30],
  ])(
    "rememberMe=%s rotates to a %i-day refresh token and session",
    async (rememberMe, expected) => {
      const user = await customer();
      const h = harness(user);
      const sessionId = randomUUID();
      const token = tokenFor(user, sessionId, rememberMe);
      const session = sessionFor(user, token);
      h.sessions.findByTokenHash.mockResolvedValue(session);

      const rotated = await h.service.refreshToken(token);
      expect(days(rotated.refreshToken)).toBe(expected);
      const persistedDays = (session.expiresAt.getTime() - Date.now()) / 86_400_000;
      expect(Math.round(persistedDays)).toBe(expected);
    },
  );

  it("refuses to refresh a deactivated account", async () => {
    const user = await customer();
    user.deactivate();
    const h = harness(user);
    const token = tokenFor(user, randomUUID(), false);
    h.sessions.findByTokenHash.mockResolvedValue(sessionFor(user, token));
    await expect(h.service.refreshToken(token)).rejects.toBeInstanceOf(UserInactiveError);
    expect(user.status).toBe(UserStatus.INACTIVE);
  });
});

describe("second-factor verification limits", () => {
  let userId: string;
  const correct = "123456";
  const authService = () => ({
    twoFactorPendingUserId: vi.fn(() => userId),
    verifyTwoFactorLogin: vi.fn(async (_token: string, code: string) => {
      if (code !== correct) throw new InvalidCredentialsError();
      return { accessToken: "access" } as never;
    }),
  });

  beforeEach(() => {
    userId = randomUUID();
  });

  it("locks the user's second factor after five wrong codes, even for the right code", async () => {
    const auth = authService();
    const handler = new Verify2FALoginHandler(auth as never, TokenBlacklistService);
    const attempt = (code: string) =>
      handler.handle({ pendingToken: "pending", code, ipAddress: "1.1.1.1" });
    for (let i = 0; i < 5; i++)
      await expect(attempt("000000")).rejects.toBeInstanceOf(InvalidCredentialsError);

    const locked = await attempt(correct);
    expect(locked.success).toBe(false);
    expect(locked.statusCode).toBe(429);
    expect(auth.verifyTwoFactorLogin).toHaveBeenCalledTimes(5);
  });

  it("accepts each authenticator code only once", async () => {
    const handler = new Verify2FALoginHandler(authService() as never, TokenBlacklistService);
    const attempt = () =>
      handler.handle({ pendingToken: "pending", code: correct, ipAddress: "1.1.1.1" });
    expect((await attempt()).success).toBe(true);
    await expect(attempt()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects a pending token that does not verify without counting it against anyone", async () => {
    const auth = { ...authService(), twoFactorPendingUserId: vi.fn(() => null) };
    const handler = new Verify2FALoginHandler(auth as never, TokenBlacklistService);
    await expect(
      handler.handle({ pendingToken: "forged", code: correct, ipAddress: "1.1.1.1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(auth.verifyTwoFactorLogin).not.toHaveBeenCalled();
  });
});

describe("login lockout", () => {
  it("counts case and whitespace variants of one address together", async () => {
    const login = vi.fn().mockRejectedValue(new InvalidCredentialsError());
    const handler = new LoginUserHandler({ login } as never, TokenBlacklistService);
    const email = `Victim-${randomUUID()}@Example.test`;
    const variants = [email, email.toLowerCase(), email.toUpperCase(), ` ${email} `];
    for (let i = 0; i < 10; i++) {
      await expect(
        handler.handle({
          email: variants[i % variants.length]!,
          password: "wrong",
          ipAddress: "2.2.2.2",
        }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }
    const locked = await handler.handle({
      email: email.toLowerCase(),
      password: "x",
      ipAddress: "2.2.2.2",
    });
    expect(locked.statusCode).toBe(429);
    expect(login).toHaveBeenCalledTimes(10);
  });
});

describe("new password policy", () => {
  it.each([
    ["seven characters", "Ab1!xyz", false],
    ["eight characters with four classes", "Ab1!xyzw", true],
    ["exactly 72 bytes", `Aa1!${"x".repeat(68)}`, true],
    ["73 bytes (bcrypt would ignore the tail)", `Aa1!${"x".repeat(69)}`, false],
    ["over 72 bytes through multi-byte characters", `Aa1!${"é".repeat(35)}`, false],
  ])("%s -> valid=%s", (_label, password, valid) => {
    expect(hasher.validatePasswordStrength(password).isValid).toBe(valid);
  });

  it("still verifies an existing hash of a longer legacy password", async () => {
    const legacy = `Aa1!${"x".repeat(100)}`;
    const hash = (await hasher.hash(legacy)) as string;
    expect(await hasher.verify(legacy, hash)).toBe(true);
  });
});
