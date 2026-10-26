import "fastify";
import type { AuthenticatedUser } from "../shared/interfaces/authenticated-request.interface";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
    rawBody?: Buffer;
  }

  interface FastifyContextConfig {
    rawBody?: boolean;
  }

  interface FastifySchema {
    tags?: string[];
    summary?: string;
    description?: string;
    security?: Array<Record<string, string[]>>;
  }
}
