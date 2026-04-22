import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderAddressController } from "../controllers/order-address.controller";
import { authenticateUser } from "@/api/src/shared/middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  orderAddressParamsSchema,
  setOrderAddressesSchema,
  updateBillingAddressSchema,
  updateShippingAddressSchema,
  orderAddressResponseSchema,
} from "../validation/order-address.schema";

const addressBodySchema = {
  type: "object",
  required: [
    "firstName",
    "lastName",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "country",
  ],
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    addressLine1: { type: "string" },
    addressLine2: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    postalCode: { type: "string" },
    country: { type: "string" },
    phone: { type: "string" },
    email: { type: "string", format: "email" },
  },
};

export async function registerOrderAddressRoutes(
  fastify: FastifyInstance,
  orderAddressController: OrderAddressController,
): Promise<void> {
  // Set order addresses (billing & shipping)
  fastify.post(
    "/orders/:orderId/addresses",
    {
      preValidation: [validateParams(orderAddressParamsSchema), validateBody(setOrderAddressesSchema)],
      preHandler: [authenticateUser],
      schema: {
        description:
          "Set billing and shipping addresses for an order. Order must be in 'created' status.",
        tags: ["Order Addresses"],
        summary: "Set Order Addresses",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["billingAddress", "shippingAddress"],
          properties: {
            billingAddress: addressBodySchema,
            shippingAddress: addressBodySchema,
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderAddressResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderAddressController.setAddresses(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Get order addresses
  fastify.get(
    "/orders/:orderId/addresses",
    {
      preValidation: [validateParams(orderAddressParamsSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Get billing and shipping addresses for an order",
        tags: ["Order Addresses"],
        summary: "Get Order Addresses",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderAddressResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderAddressController.getAddresses(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Update billing address
  fastify.patch(
    "/orders/:orderId/addresses/billing",
    {
      preValidation: [validateParams(orderAddressParamsSchema), validateBody(updateBillingAddressSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Update billing address for an order",
        tags: ["Order Addresses"],
        summary: "Update Billing Address",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        body: addressBodySchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderAddressResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderAddressController.updateBillingAddress(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Update shipping address
  fastify.patch(
    "/orders/:orderId/addresses/shipping",
    {
      preValidation: [validateParams(orderAddressParamsSchema), validateBody(updateShippingAddressSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Update shipping address for an order",
        tags: ["Order Addresses"],
        summary: "Update Shipping Address",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        body: addressBodySchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderAddressResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderAddressController.updateShippingAddress(
        request as AuthenticatedRequest,
        reply,
      ),
  );
}
