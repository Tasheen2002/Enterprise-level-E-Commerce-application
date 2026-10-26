import { FastifyRequest, RouteGenericInterface } from "fastify";

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  sessionId?: string;
  updatedAt?: string;
  createdAt?: string;
}

export type AuthenticatedUser = JWTPayload;

export interface AuthenticatedRequest<RouteGeneric extends RouteGenericInterface = any>
  extends FastifyRequest<RouteGeneric> {
  user: AuthenticatedUser;
}
