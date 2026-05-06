import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { BnplTransactionController } from "../controllers/bnpl-transaction.controller";
import {
  RolePermissions,
  authenticate,
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  createBnplTransactionSchema,
  bnplParamsSchema,
  listBnplQuerySchema,
  bnplTransactionResponseSchema,
} from "../validation/bnpl.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const createBnplTransactionBodyJson = toJsonSchema(createBnplTransactionSchema);
const bnplParamsJson = toJsonSchema(bnplParamsSchema);
const listBnplQueryJson = toJsonSchema(listBnplQuerySchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
});

export async function registerBnplTransactionRoutes(
  fastify: FastifyInstance,
  controller: BnplTransactionController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /bnpl
  fastify.post(
    "/bnpl",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(createBnplTransactionSchema)],
      schema: {
        description: "Create a Buy Now Pay Later (BNPL) transaction.",
        tags: ["BNPL"],
        summary: "Create BNPL Transaction",
        security: [{ bearerAuth: [] }],
        body: createBnplTransactionBodyJson,
        response: {
          201: successResponse(bnplTransactionResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /bnpl/:bnplId/:action — Staff/Admin only
  fastify.post(
    "/bnpl/:bnplId/:action",
    {
      preValidation: [validateParams(bnplParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Process a BNPL transaction (approve, reject, activate, complete, cancel, fail) — Staff/Admin only.",
        tags: ["BNPL"],
        summary: "Process BNPL Transaction",
        security: [{ bearerAuth: [] }],
        params: bnplParamsJson,
        response: {
          200: successResponse(bnplTransactionResponseSchema),
        },
      },
    },
    (request, reply) => controller.process(request as AuthenticatedRequest, reply),
  );

  // GET /bnpl
  fastify.get(
    "/bnpl",
    {
      preValidation: [validateQuery(listBnplQuerySchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "List BNPL transactions with optional filters.",
        tags: ["BNPL"],
        summary: "List BNPL Transactions",
        security: [{ bearerAuth: [] }],
        querystring: listBnplQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: bnplTransactionResponseSchema,
          }),
        },
      },
    },
    (request, reply) => controller.list(request as AuthenticatedRequest, reply),
  );
}
