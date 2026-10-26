import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  if (fastify.hasDecorator("prisma")) throw new Error("Database client already registered");
  const prisma = new PrismaClient({
    datasources: { db: { url: fastify.config.DATABASE_URL } },
    log: fastify.config.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  // Remain lazy: readiness/queries establish connections. Cleanup has one owner,
  // including registration failures after the client has been constructed.
  let disconnecting: Promise<void> | undefined;
  const disconnect = () => (disconnecting ??= Promise.resolve().then(() => prisma.$disconnect()));

  try {
    fastify.addHook("onClose", async () => {
      await disconnect();
      fastify.log.info("Database connection closed");
    });
    fastify.decorate("prisma", prisma);
    fastify.log.info("Database client registered");
  } catch (error) {
    try {
      await disconnect();
    } catch (cleanupError) {
      fastify.log.error({ err: cleanupError }, "Database client cleanup failed");
    }
    throw error;
  }
};

export default fp(dbPlugin, {
  name: "db-plugin",
  dependencies: ["config"],
  decorators: { fastify: ["config"] },
});
