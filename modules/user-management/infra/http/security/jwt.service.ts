import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  IJwtService,
  PendingTwoFactorPayload,
  TokenPayload,
} from "../../../application/services/ijwt.service";

export interface JwtServiceConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
}

export class JwtService implements IJwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(config: JwtServiceConfig) {
    if (!config.accessTokenSecret || !config.refreshTokenSecret) {
      throw new Error("JwtService: accessTokenSecret and refreshTokenSecret are required");
    }
    this.accessTokenSecret = config.accessTokenSecret;
    this.refreshTokenSecret = config.refreshTokenSecret;
    this.accessTokenExpiresIn = config.accessTokenExpiresIn ?? "15m";
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn ?? "7d";
  }

  signAccess(payload: Omit<TokenPayload, "type">): string {
    return jwt.sign({ ...payload, type: "access" }, this.accessTokenSecret, {
      algorithm: "HS256",
      jwtid: randomUUID(),
      expiresIn: this.accessTokenExpiresIn,
    } as SignOptions);
  }

  signRefresh(payload: Omit<TokenPayload, "type">, rememberMe?: boolean): string {
    const expiresIn = rememberMe ? "30d" : this.refreshTokenExpiresIn;
    return jwt.sign({ ...payload, type: "refresh" }, this.refreshTokenSecret, {
      algorithm: "HS256",
      jwtid: randomUUID(),
      expiresIn,
    } as SignOptions);
  }

  verifyAccess(token: string): TokenPayload {
    return identityClaims
      .extend({ type: z.literal("access") })
      .parse(jwt.verify(token, this.accessTokenSecret, { algorithms: ["HS256"] }));
  }

  verifyRefresh(token: string): TokenPayload {
    return identityClaims
      .extend({ type: z.literal("refresh") })
      .parse(jwt.verify(token, this.refreshTokenSecret, { algorithms: ["HS256"] }));
  }

  /**
   * Sign the short-lived "passed password, owe TOTP" token. Uses the
   * access-token secret with a fixed 5-minute lifetime — a separate
   * secret would be over-engineered for a 5-minute token, and the
   * `type: '2fa_pending'` claim guarantees this token is rejected if
   * fed back into `verifyAccess` or `verifyRefresh`, which validate
   * their respective token types at runtime.
   */
  signTwoFactorPending(payload: Omit<PendingTwoFactorPayload, "type">): string {
    return jwt.sign({ ...payload, type: "2fa_pending" }, this.accessTokenSecret, {
      algorithm: "HS256",
      jwtid: randomUUID(),
      expiresIn: "5m",
    } as SignOptions);
  }

  verifyTwoFactorPending(token: string): PendingTwoFactorPayload {
    return z
      .object({
        userId: z.string().uuid(),
        email: z.string().email(),
        rememberMe: z.boolean(),
        type: z.literal("2fa_pending"),
        exp: z.number().int().positive(),
      })
      .parse(jwt.verify(token, this.accessTokenSecret, { algorithms: ["HS256"] }));
  }

  getAccessExpiresInSeconds(): number {
    return JwtService.parseExpiresInToSeconds(this.accessTokenExpiresIn);
  }

  private static parseExpiresInToSeconds(expiresIn: string): number {
    if (!/^[1-9]\d*[smhd]$/.test(expiresIn)) throw new Error("Invalid token expiry");
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);
    if (Number.isNaN(value)) {
      throw new Error(`Invalid expiresIn value: ${expiresIn}`);
    }
    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 60 * 60 * 24;
      default:
        throw new Error(
          `Unsupported expiresIn unit: '${unit}' in '${expiresIn}'. Use s, m, h, or d.`,
        );
    }
  }
}

const identityClaims = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST", "VENDOR", "CUSTOMER"]),
  sessionId: z.string().uuid().optional(),
  exp: z.number().int().positive(),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
});
