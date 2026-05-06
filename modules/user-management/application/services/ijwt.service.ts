export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface IJwtService {
  signAccess(payload: Omit<TokenPayload, "type">): string;
  signRefresh(payload: Omit<TokenPayload, "type">, rememberMe?: boolean): string;
  verifyAccess(token: string): TokenPayload;
  verifyRefresh(token: string): TokenPayload;
  getAccessExpiresInSeconds(): number;
}
