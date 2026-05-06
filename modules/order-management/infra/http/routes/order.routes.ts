import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderController } from "../controllers/order.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { optionalAuth } from "@/api/src/shared/middleware/optional-auth.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  orderIdParamsSchema,
  orderNumberParamsSchema,
  trackOrderQuerySchema,
  listOrdersQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderTotalsSchema,
  orderResponseSchema,
  trackOrderResponseSchema,
  paginatedOrdersResponseSchema,
} from "../validation/order.schema";

// Per-user buckets for authenticated writes; per-IP fallback for guest writes
// (POST /orders is optionalAuth, so anonymous callers must not collide into a
// single shared "anonymous" bucket).
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
});

// Stricter per-IP limit on the public guest-tracking endpoint so attackers
// can't bulk-probe orderNumber+contact pairs. The global write hook above
// covers non-GET methods only; tracking is GET, so it needs its own limit.
const trackOrderRateLimiter = createRateLimiter({
  ...RateLimitPresets.checkout,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const orderIdParamsJson = toJsonSchema(orderIdParamsSchema);
const orderNumberParamsJson = toJsonSchema(orderNumberParamsSchema);
const trackOrderQueryJson = toJsonSchema(trackOrderQuerySchema);
const listOrdersQueryJson = toJsonSchema(listOrdersQuerySchema);
const createOrderBodyJson = toJsonSchema(createOrderSchema);
const updateOrderStatusBodyJson = toJsonSchema(updateOrderStatusSchema);
const updateOrderTotalsBodyJson = toJsonSchema(updateOrderTotalsSchema);

export async function registerOrderRoutes(
  fastify: FastifyInstance,
  orderController: OrderController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // Track order (public — guest tracking via orderNumber+contact or trackingNumber)
  fastify.get(
    "/orders/track",
    {
      preValidation: [validateQuery(trackOrderQuerySchema)],
      // Limiter runs first so flooded requests don't burn an optionalAuth
      // JWT lookup before being rejected.
      preHandler: [trackOrderRateLimiter, optionalAuth],
      schema: {
        description:
          "Track an order publicly without authentication. Requires either order number + email/phone, or tracking number.",
        tags: ["Orders"],
        summary: "Track Order (Public)",
        querystring: trackOrderQueryJson,
        response: {
          200: successResponse(trackOrderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.trackOrder(request as AuthenticatedRequest, reply),
  );

  // List orders — non-staff requesters are scoped to their own orders by the service.
  fastify.get(
    "/orders",
    {
      preValidation: [validateQuery(listOrdersQuerySchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get paginated list of orders with filtering options",
        tags: ["Orders"],
        summary: "List Orders",
        security: [{ bearerAuth: [] }],
        querystring: listOrdersQueryJson,
        response: {
          200: successResponse(paginatedOrdersResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.listOrders(request as AuthenticatedRequest, reply),
  );

  // Get order by order number (declared before /orders/:orderId to avoid collision)
  fastify.get(
    "/orders/number/:orderNumber",
    {
      preValidation: [validateParams(orderNumberParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get order by order number",
        tags: ["Orders"],
        summary: "Get Order by Number",
        security: [{ bearerAuth: [] }],
        params: orderNumberParamsJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.getOrderByOrderNumber(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Get order by ID
  fastify.get(
    "/orders/:orderId",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get order by ID",
        tags: ["Orders"],
        summary: "Get Order by ID",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.getOrder(request as AuthenticatedRequest, reply),
  );

  // ── Writes ──

  // Create new order — guest checkout supported via guestToken; auth optional.
  fastify.post(
    "/orders",
    {
      preHandler: [optionalAuth, validateBody(createOrderSchema)],
      schema: {
        description:
          "Create a new order. For authenticated users, userId is extracted from the auth token. For guest checkout, provide guestToken.",
        tags: ["Orders"],
        summary: "Create Order",
        security: [{ bearerAuth: [] }, {}],
        body: createOrderBodyJson,
        response: {
          201: successResponse(orderResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      orderController.createOrder(request as AuthenticatedRequest, reply),
  );

  // Update order status (Admin override — bypasses pre-conditions like
  // "address required for paid"; state-machine guards still apply)
  fastify.patch(
    "/orders/:orderId/status",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [
        authenticate,
        RolePermissions.STAFF_LEVEL,
        validateBody(updateOrderStatusSchema),
      ],
      schema: {
        description: "Update order status (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Update Order Status",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        body: updateOrderStatusBodyJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.updateOrderStatus(request as AuthenticatedRequest, reply),
  );

  // Update order totals
  fastify.patch(
    "/orders/:orderId/totals",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [
        authenticate,
        RolePermissions.STAFF_LEVEL,
        validateBody(updateOrderTotalsSchema),
      ],
      schema: {
        description: "Update order totals (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Update Order Totals",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        body: updateOrderTotalsBodyJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.updateOrderTotals(request as AuthenticatedRequest, reply),
  );

  // Mark order as paid
  fastify.post(
    "/orders/:orderId/mark-paid",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Mark order as paid (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Mark Order as Paid",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.markOrderAsPaid(request as AuthenticatedRequest, reply),
  );

  // Mark order as fulfilled
  fastify.post(
    "/orders/:orderId/mark-fulfilled",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Mark order as fulfilled (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Mark Order as Fulfilled",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.markOrderAsFulfilled(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Cancel order — customers can cancel their own orders; staff can cancel any.
  fastify.post(
    "/orders/:orderId/cancel",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description:
          "Cancel an order. Customers may cancel their own; staff may cancel any.",
        tags: ["Orders"],
        summary: "Cancel Order",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        response: {
          200: successResponse(orderResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderController.cancelOrder(request as AuthenticatedRequest, reply),
  );

  // Delete order
  fastify.delete(
    "/orders/:orderId",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete an order (Admin only)",
        tags: ["Orders"],
        summary: "Delete Order",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      orderController.deleteOrder(request as AuthenticatedRequest, reply),
  );
}
