import { FastifyInstance } from "fastify";
import { PaymentMethodsController, AddPaymentMethodRequest, UpdatePaymentMethodRequest } from "../controllers/payment-methods.controller";
import { authenticate } from "@/api/src/shared/middleware";

const paymentMethodObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    type: {
      type: "string",
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    },
    provider: { type: "string" },
    last4: { type: "string" },
    brand: { type: "string" },
    expiryMonth: { type: "integer" },
    expiryYear: { type: "integer" },
    billingName: { type: "string" },
    isDefault: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const paymentMethodBodyProperties = {
  type: {
    type: "string",
    enum: ["credit_card", "debit_card", "paypal", "bank_transfer"],
  },
  provider: { type: "string", minLength: 1, maxLength: 50 },
  last4: { type: "string", minLength: 4, maxLength: 4 },
  brand: { type: "string", maxLength: 50 },
  expiryMonth: { type: "integer", minimum: 1, maximum: 12 },
  expiryYear: { type: "integer", minimum: new Date().getFullYear() },
  billingName: { type: "string", minLength: 1, maxLength: 200 },
  isDefault: { type: "boolean" },
};

const paymentMethodIdParam = {
  type: "object",
  required: ["paymentMethodId"],
  properties: {
    paymentMethodId: { type: "string", format: "uuid" },
  },
};

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
              data: { type: "array", items: paymentMethodObject },
            },
          },
        },
      },
    },
    controller.getCurrentUserPaymentMethods.bind(controller),
  );

  // POST /users/me/payment-methods
  fastify.post<{ Body: AddPaymentMethodRequest }>(
    "/users/me/payment-methods",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Payment Methods"],
        summary: "Add a payment method",
        description: "Save a new payment method for the authenticated user.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "provider", "billingName"],
          properties: paymentMethodBodyProperties,
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentMethodObject,
            },
          },
        },
      },
    },
    controller.addCurrentUserPaymentMethod.bind(controller),
  );

  // PATCH /users/me/payment-methods/:paymentMethodId
  fastify.patch<{
    Params: { paymentMethodId: string };
    Body: UpdatePaymentMethodRequest;
  }>(
    "/users/me/payment-methods/:paymentMethodId",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Payment Methods"],
        summary: "Update a payment method",
        description:
          "Partially update an existing payment method. All body fields are optional.",
        security: [{ bearerAuth: [] }],
        params: paymentMethodIdParam,
        body: {
          type: "object",
          properties: paymentMethodBodyProperties,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentMethodObject,
            },
          },
        },
      },
    },
    controller.updateCurrentUserPaymentMethod.bind(controller),
  );

  // DELETE /users/me/payment-methods/:paymentMethodId
  fastify.delete<{ Params: { paymentMethodId: string } }>(
    "/users/me/payment-methods/:paymentMethodId",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Payment Methods"],
        summary: "Remove a payment method",
        description:
          "Permanently delete a payment method belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        params: paymentMethodIdParam,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.deleteCurrentUserPaymentMethod.bind(controller),
  );

  // POST /users/me/payment-methods/:paymentMethodId/set-default
  fastify.post<{ Params: { paymentMethodId: string } }>(
    "/users/me/payment-methods/:paymentMethodId/set-default",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Payment Methods"],
        summary: "Set default payment method",
        description:
          "Mark a payment method as the user's default for checkout.",
        security: [{ bearerAuth: [] }],
        params: paymentMethodIdParam,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.setDefaultPaymentMethod.bind(controller),
  );
}
