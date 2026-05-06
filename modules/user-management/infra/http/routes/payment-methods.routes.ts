import { FastifyInstance } from "fastify";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  addPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdParamsSchema,
  listPaymentMethodsQuerySchema,
  paymentMethodResponseSchema,
  paymentMethodListResponseSchema,
} from "../validation/payment-method.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const addPaymentMethodBodyJson = toJsonSchema(addPaymentMethodSchema);
const updatePaymentMethodBodyJson = toJsonSchema(updatePaymentMethodSchema);
const paymentMethodIdParamsJson = toJsonSchema(paymentMethodIdParamsSchema);
const listPaymentMethodsQueryJson = toJsonSchema(listPaymentMethodsQuerySchema);

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
      preValidation: [validateQuery(listPaymentMethodsQuerySchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "List payment methods",
        description: "Retrieve a paginated list of saved payment methods for the authenticated user.",
        security: [{ bearerAuth: [] }],
        querystring: listPaymentMethodsQueryJson,
        response: {
          200: successResponse(paymentMethodListResponseSchema),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(addPaymentMethodSchema)],
      schema: {
        tags: ["Payment Methods"],
        summary: "Add a payment method",
        description: "Save a new payment method for the authenticated user.",
        security: [{ bearerAuth: [] }],
        body: addPaymentMethodBodyJson,
        response: {
          201: successResponse(paymentMethodResponseSchema, 201),
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
      preValidation: [validateParams(paymentMethodIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(updatePaymentMethodSchema)],
      schema: {
        tags: ["Payment Methods"],
        summary: "Update a payment method",
        description: "Partially update an existing payment method. All body fields are optional.",
        security: [{ bearerAuth: [] }],
        params: paymentMethodIdParamsJson,
        body: updatePaymentMethodBodyJson,
        response: {
          200: successResponse(paymentMethodResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/me/payment-methods/:paymentMethodId/default — set as default
  fastify.patch(
    "/users/me/payment-methods/:paymentMethodId/default",
    {
      preValidation: [validateParams(paymentMethodIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Set default payment method",
        description: "Mark a payment method as the user's default for checkout.",
        security: [{ bearerAuth: [] }],
        params: paymentMethodIdParamsJson,
        response: {
          200: successResponse(paymentMethodResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.setDefaultCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );

  // DELETE /users/me/payment-methods/:paymentMethodId
  fastify.delete(
    "/users/me/payment-methods/:paymentMethodId",
    {
      preValidation: [validateParams(paymentMethodIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Remove a payment method",
        description: "Permanently delete a payment method belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        params: paymentMethodIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteCurrentUserPaymentMethod(request as AuthenticatedRequest, reply),
  );
}
