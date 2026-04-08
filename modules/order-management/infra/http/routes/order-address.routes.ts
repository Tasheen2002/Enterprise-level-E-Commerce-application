import { FastifyInstance } from "fastify";
import {
  OrderAddressController,
  SetAddressesRequest,
  GetAddressesRequest,
  UpdateBillingAddressRequest,
  UpdateShippingAddressRequest,
} from "../controllers/order-address.controller";
import { authenticateUser } from "@/api/src/shared/middleware";

const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "string" } },
    },
  },
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
    },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

const addressSchema = {
  type: "object",
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

const addressResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "string", format: "uuid" },
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    isSameAddress: { type: "boolean" },
  },
};

export async function registerOrderAddressRoutes(
  fastify: FastifyInstance,
  orderAddressController: OrderAddressController,
): Promise<void> {
  // Set order addresses (billing & shipping)
  fastify.post<SetAddressesRequest>(
    "/orders/:orderId/addresses",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Set billing and shipping addresses for an order. Order must be in 'created' status.",
        tags: ["Order Addresses"],
        summary: "Set Order Addresses",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        body: {
          type: "object",
          required: ["billingAddress", "shippingAddress"],
          properties: {
            billingAddress: {
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
              properties: addressSchema.properties,
            },
            shippingAddress: {
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
              properties: addressSchema.properties,
            },
          },
        },
        response: {
          201: {
            description: "Order addresses set successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: addressResponseSchema,
              message: {
                type: "string",
                example: "Order addresses set successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderAddressController.setAddresses.bind(orderAddressController),
  );

  // Get order addresses
  fastify.get<GetAddressesRequest>(
    "/orders/:orderId/addresses",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get billing and shipping addresses for an order",
        tags: ["Order Addresses"],
        summary: "Get Order Addresses",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order addresses retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: addressResponseSchema,
            },
          },
          ...errorResponses,
        },
      },
    },
    orderAddressController.getAddresses.bind(orderAddressController),
  );

  // Update billing address
  fastify.patch<UpdateBillingAddressRequest>(
    "/orders/:orderId/addresses/billing",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Update billing address for an order",
        tags: ["Order Addresses"],
        summary: "Update Billing Address",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        body: {
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
          properties: addressSchema.properties,
        },
        response: {
          200: {
            description: "Billing address updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: addressResponseSchema,
              message: {
                type: "string",
                example: "Billing address updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderAddressController.updateBillingAddress.bind(orderAddressController),
  );

  // Update shipping address
  fastify.patch<UpdateShippingAddressRequest>(
    "/orders/:orderId/addresses/shipping",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Update shipping address for an order",
        tags: ["Order Addresses"],
        summary: "Update Shipping Address",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        body: {
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
          properties: addressSchema.properties,
        },
        response: {
          200: {
            description: "Shipping address updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: addressResponseSchema,
              message: {
                type: "string",
                example: "Shipping address updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderAddressController.updateShippingAddress.bind(orderAddressController),
  );
}
