import "fastify";

declare module "fastify" {
  // prisma is declared in plugins/db.ts
  // signToken/verifyToken/authenticate are declared in plugins/auth.ts
  // config is declared in plugins/config.ts

  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
      role?: string;
    };
  }

  interface FastifySchema {
    tags?: string[];
    summary?: string;
    description?: string;
    security?: Array<Record<string, string[]>>;
  }
}
