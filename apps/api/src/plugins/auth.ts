import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { JwtService } from "../../../../modules/user-management/infra/http/security/jwt.service";
import { TokenBlacklistService } from "../../../../modules/user-management/infra/http/security/token-blacklist";
import type { TokenPayload } from "../../../../modules/user-management/application/services/ijwt.service";
import type { UserRole } from "@prisma/client";
import type { JWTPayload } from "../shared/interfaces/authenticated-request.interface";

export type { JWTPayload };

declare module "fastify" {
  interface FastifyInstance {
    verifyToken: (token: string) => JWTPayload;
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Verification only: tokens are issued by the user-management JwtService with a session.
  const verifier = new JwtService({
    accessTokenSecret: fastify.config.JWT_SECRET,
    refreshTokenSecret: fastify.config.JWT_SECRET,
  });
  const unauthorized = () =>
    Object.assign(new Error("Invalid or expired access token"), { statusCode: 401 });
  fastify.decorateRequest("user", null);

  fastify.decorate("verifyToken", (token: string): JWTPayload => {
    try {
      if (TokenBlacklistService.isTokenBlacklisted(token)) throw unauthorized();
      return verifier.verifyAccess(token);
    } catch {
      const err = new Error("Invalid or expired token") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }
  });

  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      const authHeader = request.headers.authorization;
      const match = authHeader?.match(/^Bearer +([A-Za-z0-9._~+/-]+=*)$/i);
      if (!match) {
        const err = new Error("Missing or invalid authorization header") as Error & {
          statusCode: number;
        };
        err.statusCode = 401;
        throw err;
      }
      const token = match[1];
      const payload = fastify.verifyToken(token) as TokenPayload;
      // Every access token must map to a live session so logout/revocation take effect.
      if (!payload.sessionId) throw unauthorized();
      const session = await fastify.prisma.memberSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
          user: { status: "active", role: payload.role as UserRole },
        },
        select: { id: true },
      });
      if (!session) throw unauthorized();
      (request as FastifyRequest & { user: JWTPayload }).user = payload;
    } catch (error) {
      request.user = null;
      // Infrastructure outages must remain server errors, not invalid credentials.
      throw error;
    }
  });

  fastify.log.info("Authentication plugin registered");
};

// Fail at registration rather than silently skipping session checks or reading
// an unvalidated ambient secret.
export default fp(authPlugin, {
  name: "auth-plugin",
  decorators: { fastify: ["config", "prisma"] },
});
