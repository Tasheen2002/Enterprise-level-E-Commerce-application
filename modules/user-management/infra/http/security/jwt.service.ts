import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  IJwtService,
  TokenPayload,
} from '../../../application/services/ijwt.service';
import { DomainValidationError } from '../../../domain/errors/user-management.errors';

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
      throw new DomainValidationError('JWT secrets are required');
    }
    this.accessTokenSecret = config.accessTokenSecret;
    this.refreshTokenSecret = config.refreshTokenSecret;
    this.accessTokenExpiresIn = config.accessTokenExpiresIn || '15m';
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn || '7d';
  }

  signAccess(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      this.accessTokenSecret,
      { expiresIn: this.accessTokenExpiresIn } as SignOptions
    );
  }

  signRefresh(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiresIn } as SignOptions
    );
  }

  verifyAccess(token: string): TokenPayload {
    return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
  }

  verifyRefresh(token: string): TokenPayload {
    return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
  }

  getAccessExpiresInSeconds(): number {
    return JwtService.parseExpiresInToSeconds(this.accessTokenExpiresIn);
  }

  private static parseExpiresInToSeconds(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default:  return 900;
    }
  }
}
