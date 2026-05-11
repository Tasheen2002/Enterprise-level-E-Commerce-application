import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  IJwtService,
  PendingTwoFactorPayload,
  TokenPayload,
} from '../../../application/services/ijwt.service';

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
      throw new Error('JwtService: accessTokenSecret and refreshTokenSecret are required');
    }
    this.accessTokenSecret = config.accessTokenSecret;
    this.refreshTokenSecret = config.refreshTokenSecret;
    this.accessTokenExpiresIn = config.accessTokenExpiresIn ?? '15m';
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn ?? '7d';
  }

  signAccess(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      this.accessTokenSecret,
      { expiresIn: this.accessTokenExpiresIn } as SignOptions
    );
  }

  signRefresh(payload: Omit<TokenPayload, 'type'>, rememberMe?: boolean): string {
    const expiresIn = rememberMe ? '30d' : this.refreshTokenExpiresIn;
    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.refreshTokenSecret,
      { expiresIn } as SignOptions
    );
  }

  verifyAccess(token: string): TokenPayload {
    return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
  }

  verifyRefresh(token: string): TokenPayload {
    return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
  }

  /**
   * Sign the short-lived "passed password, owe TOTP" token. Uses the
   * access-token secret with a fixed 5-minute lifetime — a separate
   * secret would be over-engineered for a 5-minute token, and the
   * `type: '2fa_pending'` claim guarantees this token is rejected if
   * fed back into `verifyAccess` or `verifyRefresh` (those don't
   * type-check the claim, but the controllers do via their distinct
   * verify methods).
   */
  signTwoFactorPending(
    payload: Omit<PendingTwoFactorPayload, 'type'>,
  ): string {
    return jwt.sign(
      { ...payload, type: '2fa_pending' },
      this.accessTokenSecret,
      { expiresIn: '5m' } as SignOptions,
    );
  }

  verifyTwoFactorPending(token: string): PendingTwoFactorPayload {
    const decoded = jwt.verify(
      token,
      this.accessTokenSecret,
    ) as Partial<PendingTwoFactorPayload>;
    if (decoded.type !== '2fa_pending') {
      throw new Error('Invalid token type for 2FA challenge');
    }
    if (
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.rememberMe !== 'boolean'
    ) {
      throw new Error('Malformed 2FA pending token');
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      rememberMe: decoded.rememberMe,
      type: '2fa_pending',
    };
  }

  getAccessExpiresInSeconds(): number {
    return JwtService.parseExpiresInToSeconds(this.accessTokenExpiresIn);
  }

  private static parseExpiresInToSeconds(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);
    if (Number.isNaN(value)) {
      throw new Error(`Invalid expiresIn value: ${expiresIn}`);
    }
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default:
        throw new Error(
          `Unsupported expiresIn unit: '${unit}' in '${expiresIn}'. Use s, m, h, or d.`,
        );
    }
  }
}
