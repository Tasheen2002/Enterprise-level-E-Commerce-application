import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient({
    log: fastify.config.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  fastify.decorate("prisma", prisma);
  fastify.log.info("Database client registered");

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
    fastify.log.info("Database connection closed");
  });
};

export default fp(dbPlugin, { name: "db-plugin" });
