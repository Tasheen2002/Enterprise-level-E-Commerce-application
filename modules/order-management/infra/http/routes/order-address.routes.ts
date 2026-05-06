import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderAddressController } from "../controllers/order-address.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, toJsonSchema } from "../validation/validator";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import {
  orderAddressParamsSchema,
  setOrderAddressesSchema,
  updateBillingAddressSchema,
  updateShippingAddressSchema,
  orderAddressResponseSchema,
} from "../validation/order-address.schema";

// All address routes require authentication, so userKeyGenerator gives proper
// per-user buckets — no anonymous-bucket concern.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const orderAddressParamsJson = toJsonSchema(orderAddressParamsSchema);
const setOrderAddressesBodyJson = toJsonSchema(setOrderAddressesSchema);
const updateBillingAddressBodyJson = toJsonSchema(updateBillingAddressSchema);
const updateShippingAddressBodyJson = toJsonSchema(updateShippingAddressSchema);

export async function registerOrderAddressRoutes(
  fastify: FastifyInstance,
  orderAddressController: OrderAddressController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // Get order addresses
  fastify.get(
    "/orders/:orderId/addresses",
    {
      preValidation: [validateParams(orderAddressParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get billing and shipping addresses for an order",
        tags: ["Order Addresses"],
        summary: "Get Order Addresses",
        security: [{ bearerAuth: [] }],
        params: orderAddressParamsJson,
        response: {
          200: successResponse(orderAddressResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderAddressController.getAddresses(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // ── Writes ──

  // Set order addresses (billing & shipping)
  fastify.post(
    "/orders/:orderId/addresses",
    {
      preValidation: [validateParams(orderAddressParamsSchema)],
      preHandler: [authenticate, validateBody(setOrderAddressesSchema)],
      schema: {
        description:
          "Set billing and shipping addresses for an order. Order must be in 'created' status.",
        tags: ["Order Addresses"],
        summary: "Set Order Addresses",
        security: [{ bearerAuth: [] }],
        params: orderAddressParamsJson,
        body: setOrderAddressesBodyJson,
        response: {
          201: successResponse(orderAddressResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      orderAddressController.setAddresses(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Replace billing address (PUT — full replace; AddressSnapshot is immutable
  // so partial PATCH is not supported)
  fastify.put(
    "/orders/:orderId/addresses/billing",
    {
      preValidation: [validateParams(orderAddressParamsSchema)],
      preHandler: [authenticate, validateBody(updateBillingAddressSchema)],
      schema: {
        description: "Replace billing address for an order (full replacement)",
        tags: ["Order Addresses"],
        summary: "Replace Billing Address",
        security: [{ bearerAuth: [] }],
        params: orderAddressParamsJson,
        body: updateBillingAddressBodyJson,
        response: {
          200: successResponse(orderAddressResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderAddressController.updateBillingAddress(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Replace shipping address (PUT — full replace; AddressSnapshot is immutable
  // so partial PATCH is not supported)
  fastify.put(
    "/orders/:orderId/addresses/shipping",
    {
      preValidation: [validateParams(orderAddressParamsSchema)],
      preHandler: [authenticate, validateBody(updateShippingAddressSchema)],
      schema: {
        description: "Replace shipping address for an order (full replacement)",
        tags: ["Order Addresses"],
        summary: "Replace Shipping Address",
        security: [{ bearerAuth: [] }],
        params: orderAddressParamsJson,
        body: updateShippingAddressBodyJson,
        response: {
          200: successResponse(orderAddressResponseSchema),
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
