import { FastifyRequest, RouteGenericInterface } from "fastify";

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface AuthenticatedRequest<
  RouteGeneric extends RouteGenericInterface = any,
> extends FastifyRequest<RouteGeneric> {
  user: AuthenticatedUser;
}
