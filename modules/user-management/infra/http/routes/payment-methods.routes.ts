import { FastifyInstance } from "fastify";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  addPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdParamsSchema,
  paymentMethodResponseSchema,
} from "../validation/payment-method.schema";
import { successResponseSchema } from "../validation/auth.schema";

export async function registerPaymentMethodRoutes(
  fastify: FastifyInstance,
  controller: PaymentMethodsController,
) {
  // GET /users/me/payment-methods
  fastify.get(
    "/users/me/payment-methods",
    {
      preHandler: [authenticate],
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
      preHandler: [authenticate, validateBody(addPaymentMethodSchema)],
      schema: {
        tags: ["Payment Methods"],
        summary: "Add a payment method",
        description: "Save a new payment method for the authenticated user.",
        security: [{ bearerAuth: [] }],
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
      preValidation: [validateParams(paymentMethodIdParamsSchema)],
      preHandler: [authenticate, validateBody(updatePaymentMethodSchema)],
      schema: {
        tags: ["Payment Methods"],
        summary: "Update a payment method",
        description:
          "Partially update an existing payment method. All body fields are optional.",
        security: [{ bearerAuth: [] }],
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
      preHandler: [authenticate],
      schema: {
        tags: ["Payment Methods"],
        summary: "Remove a payment method",
        description:
          "Permanently delete a payment method belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponseSchema,
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
      preHandler: [authenticate],
      schema: {
        tags: ["Payment Methods"],
        summary: "Set default payment method",
        description:
          "Mark a payment method as the user's default for checkout.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponseSchema,
        },
      },
    },
    (request, reply) =>
      controller.setDefaultPaymentMethod(request as AuthenticatedRequest, reply),
  );
}
