import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
      role?: string;
    };
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
