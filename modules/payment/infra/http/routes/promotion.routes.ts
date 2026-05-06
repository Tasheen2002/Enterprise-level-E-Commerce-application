import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PromotionController } from "../controllers/promotion.controller";
import {
  RolePermissions,
  authenticate,
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import { validateBody, validateParams, toJsonSchema } from "../validation/validator";
import {
  createPromotionSchema,
  applyPromotionSchema,
  recordPromotionUsageSchema,
  promoIdParamsSchema,
  promotionResponseSchema,
  promotionUsageResponseSchema,
  applyPromotionResponseSchema,
} from "../validation/promotion.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const createPromotionBodyJson = toJsonSchema(createPromotionSchema);
const applyPromotionBodyJson = toJsonSchema(applyPromotionSchema);
const recordPromotionUsageBodyJson = toJsonSchema(recordPromotionUsageSchema);
const promoIdParamsJson = toJsonSchema(promoIdParamsSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
});

export async function registerPromotionRoutes(
  fastify: FastifyInstance,
  controller: PromotionController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /promotions — Admin only
  fastify.post(
    "/promotions",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createPromotionSchema)],
      schema: {
        description: "Create a new promotion — Admin only.",
        tags: ["Promotions"],
        summary: "Create Promotion",
        security: [{ bearerAuth: [] }],
        body: createPromotionBodyJson,
        response: {
          201: successResponse(promotionResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /promotions/apply — public
  fastify.post(
    "/promotions/apply",
    {
      preHandler: [validateBody(applyPromotionSchema)],
      schema: {
        description: "Apply a promotion code to calculate discount for an order or cart.",
        tags: ["Promotions"],
        summary: "Apply Promotion",
        body: applyPromotionBodyJson,
        response: {
          200: successResponse(applyPromotionResponseSchema),
        },
      },
    },
    (request, reply) => controller.apply(request as AuthenticatedRequest, reply),
  );

  // GET /promotions/active — public
  fastify.get(
    "/promotions/active",
    {
      schema: {
        description: "List all currently active promotions.",
        tags: ["Promotions"],
        summary: "List Active Promotions",
        response: {
          200: successResponse({
            type: "array",
            items: promotionResponseSchema,
          }),
        },
      },
    },
    (request, reply) => controller.listActive(request as AuthenticatedRequest, reply),
  );

  // POST /promotions/:promoId/usage — authenticated
  fastify.post(
    "/promotions/:promoId/usage",
    {
      preValidation: [validateParams(promoIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(recordPromotionUsageSchema)],
      schema: {
        description: "Record that a promotion was used in an order.",
        tags: ["Promotions"],
        summary: "Record Promotion Usage",
        security: [{ bearerAuth: [] }],
        params: promoIdParamsJson,
        body: recordPromotionUsageBodyJson,
        response: {
          201: successResponse(promotionUsageResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.recordUsage(request as AuthenticatedRequest, reply),
  );

  // GET /promotions/:promoId/usage — Admin only
  fastify.get(
    "/promotions/:promoId/usage",
    {
      preValidation: [validateParams(promoIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all usage records for a promotion — Admin only.",
        tags: ["Promotions"],
        summary: "List Promotion Usage",
        security: [{ bearerAuth: [] }],
        params: promoIdParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: promotionUsageResponseSchema,
          }),
        },
      },
    },
    (request, reply) => controller.listUsage(request as AuthenticatedRequest, reply),
  );
}
