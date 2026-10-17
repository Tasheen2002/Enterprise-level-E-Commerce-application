import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { JwtService } from "../../../../modules/user-management/infra/http/security/jwt.service";
import { TokenBlacklistService } from "../../../../modules/user-management/infra/http/security/token-blacklist";
import type { TokenPayload } from "../../../../modules/user-management/application/services/ijwt.service";
import type { UserRole } from "@prisma/client";

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  sessionId?: string;
  updatedAt?: string;
  createdAt?: string;
}

declare module "fastify" {
  interface FastifyInstance {
    signToken: (payload: JWTPayload) => string;
    verifyToken: (token: string) => JWTPayload;
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const JWT_SECRET = fastify.config?.JWT_SECRET ?? process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const verifier = new JwtService({
    accessTokenSecret: JWT_SECRET,
    refreshTokenSecret: JWT_SECRET,
    accessTokenExpiresIn: fastify.config?.JWT_EXPIRES_IN,
  });
  const unauthorized = () =>
    Object.assign(new Error("Invalid or expired access token"), { statusCode: 401 });
  fastify.decorateRequest("user", null);
  fastify.decorate("signToken", (payload: JWTPayload): string =>
    verifier.signAccess({ ...payload, role: payload.role ?? "CUSTOMER" }),
  );

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
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const err = new Error("Missing or invalid authorization header") as Error & {
          statusCode: number;
        };
        err.statusCode = 401;
        throw err;
      }
      const token = authHeader.substring(7);
      const payload = fastify.verifyToken(token) as TokenPayload;
      if (fastify.hasDecorator("prisma")) {
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
      }
      (request as FastifyRequest & { user: JWTPayload }).user = payload;
    } catch (error) {
      request.user = null;
      // Infrastructure outages must remain server errors, not invalid credentials.
      throw error;
    }
  });

  fastify.log.info("Authentication plugin registered");
};

export default fp(authPlugin, { name: "auth-plugin" });
