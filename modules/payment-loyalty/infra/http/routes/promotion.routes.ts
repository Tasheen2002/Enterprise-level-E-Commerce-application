import { FastifyInstance } from "fastify";
import { PromotionController } from "../controllers/promotion.controller";
import { PromotionUsageController } from "../controllers/promotion-usage.controller";
import { authenticateUser, requireAdmin } from "@/api/src/shared/middleware";

const errorResponses = {
  400: {
    description: "Bad request",
    type: "object",
    properties: { success: { type: "boolean" }, error: { type: "string" } },
  },
  401: {
    description: "Unauthorized",
    type: "object",
    properties: { success: { type: "boolean" }, error: { type: "string" } },
  },
};

export async function registerPromotionRoutes(
  fastify: FastifyInstance,
  controller: PromotionController,
  usageController: PromotionUsageController,
): Promise<void> {
  fastify.post(
    "/promotions",
    {
      preHandler: requireAdmin,
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
            rule: { type: "object" },
            startsAt: { type: "string", format: "date-time" },
            endsAt: { type: "string", format: "date-time" },
            usageLimit: { type: "number", minimum: 0 },
          },
        },
        response: {
          201: {
            description: "Promotion created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    controller.create.bind(controller) as any,
  );

  fastify.post(
    "/promotions/apply",
    {
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
            description: "Promotion applied successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponses[400],
        },
      },
    },
    controller.apply.bind(controller) as any,
  );

  fastify.get(
    "/promotions/active",
    {
      schema: {
        description: "List all currently active promotions.",
        tags: ["Promotions"],
        summary: "List Active Promotions",
        response: {
          200: {
            description: "Active promotions retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    controller.listActive.bind(controller) as any,
  );

  fastify.post(
    "/promotions/:promoId/usage",
    {
      preHandler: authenticateUser,
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
            description: "Promotion usage recorded successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    usageController.record.bind(usageController) as any,
  );

  fastify.get(
    "/promotions/:promoId/usage",
    {
      preHandler: requireAdmin,
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
            description: "Promotion usage records retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    usageController.list.bind(usageController) as any,
  );
}
