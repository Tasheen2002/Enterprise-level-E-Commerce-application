import fp from "fastify-plugin";
import { container } from "./container";
import { registerUserManagementRoutes } from "../../../modules/user-management/infrastructure/http/routes/index";

export default fp(
  async (fastify) => {
    fastify.log.info("Registering modules...");

    // ============================================
    // User Management Module
    // ============================================
    const userManagementServices = container.getUserManagementServices();
    await registerUserManagementRoutes(fastify, userManagementServices);
    fastify.log.info("✓ User Management module registered");

    fastify.log.info("All modules registered successfully");
  },
  { name: "module-loader" },
);
