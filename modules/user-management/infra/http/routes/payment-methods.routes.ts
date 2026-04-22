import { FastifyInstance } from "fastify";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  addPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdParamsSchema,
  paymentMethodResponseSchema,
} from "../validation/payment-method.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});


export async function paymentMethodRoutes(
  fastify: FastifyInstance,
  controller: PaymentMethodsController,
) {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /users/me/payment-methods
  fastify.get(
    "/users/me/payment-methods",
    {
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "List payment methods",
        description:
          "Retrieve all saved payment methods for the authenticated user.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: paymentMethodResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCurrentUserPaymentMethods(request as AuthenticatedRequest, reply),
  );

  // POST /users/me/payment-methods
  fastify.post(
    "/users/me/payment-methods",
    {
      preValidation: [validateBody(addPaymentMethodSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Add a payment method",
        description: "Save a new payment method for the authenticated user.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string", enum: ["card", "wallet", "bank", "cod", "gift_card"] },
            brand: { type: "string", maxLength: 50 },
            last4: { type: "string", pattern: "^\\d{4}$" },
            expMonth: { type: "integer", minimum: 1, maximum: 12 },
            expYear: { type: "integer" },
            billingAddressId: { type: "string", format: "uuid" },
            providerRef: { type: "string", maxLength: 100 },
            isDefault: { type: "boolean" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentMethodResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.addCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/me/payment-methods/:paymentMethodId
  fastify.patch(
    "/users/me/payment-methods/:paymentMethodId",
    {
      preValidation: [validateParams(paymentMethodIdParamsSchema), validateBody(updatePaymentMethodSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Update a payment method",
        description:
          "Partially update an existing payment method. All body fields are optional.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["paymentMethodId"],
          properties: {
            paymentMethodId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            billingAddressId: { type: "string", format: "uuid" },
            expMonth: { type: "integer", minimum: 1, maximum: 12 },
            expYear: { type: "integer" },
            providerRef: { type: "string", maxLength: 100 },
            isDefault: { type: "boolean" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentMethodResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );

  // DELETE /users/me/payment-methods/:paymentMethodId
  fastify.delete(
    "/users/me/payment-methods/:paymentMethodId",
    {
      preValidation: [validateParams(paymentMethodIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Remove a payment method",
        description:
          "Permanently delete a payment method belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["paymentMethodId"],
          properties: {
            paymentMethodId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            type: "null",
            description: "Payment method deleted successfully",
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );

  // POST /users/me/payment-methods/:paymentMethodId/set-default
  fastify.post(
    "/users/me/payment-methods/:paymentMethodId/set-default",
    {
      preValidation: [validateParams(paymentMethodIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Set default payment method",
        description:
          "Mark a payment method as the user's default for checkout.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["paymentMethodId"],
          properties: {
            paymentMethodId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.setDefaultCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );
}
