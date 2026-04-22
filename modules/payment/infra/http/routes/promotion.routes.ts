import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PromotionController } from "../controllers/promotion.controller";
import {
  RolePermissions,
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  createPromotionSchema,
  applyPromotionSchema,
  recordPromotionUsageSchema,
  promoIdParamsSchema,
  promotionResponseSchema,
  promotionUsageResponseSchema,
  applyPromotionResponseSchema,
} from "../validation/promotion.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
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
      preValidation: [validateBody(createPromotionSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new promotion — Admin only.",
        tags: ["Promotions"],
        summary: "Create Promotion",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["rule"],
          properties: {
            code: { type: "string" },
            rule: {
              type: "object",
              properties: {
                type: { type: "string" },
                value: { type: "number" },
                minPurchase: { type: "number" },
                maxDiscount: { type: "number" },
                applicableProducts: { type: "array", items: { type: "string" } },
                applicableCategories: { type: "array", items: { type: "string" } },
              },
            },
            startsAt: { type: "string", format: "date-time" },
            endsAt: { type: "string", format: "date-time" },
            usageLimit: { type: "number", minimum: 1 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: promotionResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /promotions/apply — public
  fastify.post(
    "/promotions/apply",
    {
      preValidation: [validateBody(applyPromotionSchema)],
      schema: {
        description: "Apply a promotion code to calculate discount for an order or cart.",
        tags: ["Promotions"],
        summary: "Apply Promotion",
        body: {
          type: "object",
          required: ["promoCode", "orderAmount"],
          properties: {
            promoCode: { type: "string" },
            orderId: { type: "string", format: "uuid" },
            orderAmount: { type: "number", minimum: 0 },
            currency: { type: "string" },
            products: { type: "array", items: { type: "string" } },
            categories: { type: "array", items: { type: "string" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: applyPromotionResponseSchema,
            },
          },
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "array",
                items: promotionResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listActive(request as AuthenticatedRequest, reply),
  );

  // POST /promotions/:promoId/usage — authenticated
  fastify.post(
    "/promotions/:promoId/usage",
    {
      preValidation: [validateParams(promoIdParamsSchema), validateBody(recordPromotionUsageSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Record that a promotion was used in an order.",
        tags: ["Promotions"],
        summary: "Record Promotion Usage",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["promoId"],
          properties: { promoId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["orderId", "discountAmount"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            discountAmount: { type: "number", minimum: 0 },
            currency: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: promotionUsageResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all usage records for a promotion — Admin only.",
        tags: ["Promotions"],
        summary: "List Promotion Usage",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["promoId"],
          properties: { promoId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "array",
                items: promotionUsageResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listUsage(request as AuthenticatedRequest, reply),
  );
}
