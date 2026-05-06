import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderShipmentController } from "../controllers/order-shipment.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, toJsonSchema } from "../validation/validator";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import {
  orderShipmentsParamsSchema,
  orderShipmentParamsSchema,
  createShipmentSchema,
  markShippedSchema,
  updateShipmentTrackingSchema,
  markDeliveredSchema,
  shipmentResponseSchema,
} from "../validation/order-shipment.schema";

// All order shipment writes are authenticated, so userKeyGenerator gives proper
// per-user/staff buckets — no anonymous-bucket concern here.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const orderShipmentsParamsJson = toJsonSchema(orderShipmentsParamsSchema);
const orderShipmentParamsJson = toJsonSchema(orderShipmentParamsSchema);
const createShipmentBodyJson = toJsonSchema(createShipmentSchema);
const markShippedBodyJson = toJsonSchema(markShippedSchema);
const updateShipmentTrackingBodyJson = toJsonSchema(updateShipmentTrackingSchema);
const markDeliveredBodyJson = toJsonSchema(markDeliveredSchema);

export async function registerOrderShipmentRoutes(
  fastify: FastifyInstance,
  orderShipmentController: OrderShipmentController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // Get all shipments for an order
  fastify.get(
    "/orders/:orderId/shipments",
    {
      preValidation: [validateParams(orderShipmentsParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get all shipments for an order",
        tags: ["Order Shipments"],
        summary: "Get Order Shipments",
        security: [{ bearerAuth: [] }],
        params: orderShipmentsParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: shipmentResponseSchema,
          }),
        },
      },
    },
    (request, reply) =>
      orderShipmentController.getShipments(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Get single shipment
  fastify.get(
    "/orders/:orderId/shipments/:shipmentId",
    {
      preValidation: [validateParams(orderShipmentParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get a specific shipment by ID",
        tags: ["Order Shipments"],
        summary: "Get Shipment",
        security: [{ bearerAuth: [] }],
        params: orderShipmentParamsJson,
        response: {
          200: successResponse(shipmentResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderShipmentController.getShipment(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // ── Writes ──

  // Create shipment for an order
  fastify.post(
    "/orders/:orderId/shipments",
    {
      preValidation: [validateParams(orderShipmentsParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(createShipmentSchema)],
      schema: {
        description: "Create a new shipment for an order (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Create Shipment",
        security: [{ bearerAuth: [] }],
        params: orderShipmentsParamsJson,
        body: createShipmentBodyJson,
        response: {
          201: successResponse(shipmentResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      orderShipmentController.createShipment(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Mark shipment as shipped
  fastify.post(
    "/orders/:orderId/shipments/:shipmentId/mark-shipped",
    {
      preValidation: [validateParams(orderShipmentParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(markShippedSchema)],
      schema: {
        description:
          "Mark a shipment as shipped with carrier and tracking details (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Mark Shipment as Shipped",
        security: [{ bearerAuth: [] }],
        params: orderShipmentParamsJson,
        body: markShippedBodyJson,
        response: {
          200: successResponse(shipmentResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderShipmentController.markShipped(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Update shipment tracking
  fastify.patch(
    "/orders/:orderId/shipments/:shipmentId/tracking",
    {
      preValidation: [validateParams(orderShipmentParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(updateShipmentTrackingSchema)],
      schema: {
        description: "Update shipment tracking information (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Update Shipment Tracking",
        security: [{ bearerAuth: [] }],
        params: orderShipmentParamsJson,
        body: updateShipmentTrackingBodyJson,
        response: {
          200: successResponse(shipmentResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderShipmentController.updateTracking(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Mark shipment as delivered
  fastify.post(
    "/orders/:orderId/shipments/:shipmentId/mark-delivered",
    {
      preValidation: [validateParams(orderShipmentParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(markDeliveredSchema)],
      schema: {
        description: "Mark a shipment as delivered (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Mark Shipment as Delivered",
        security: [{ bearerAuth: [] }],
        params: orderShipmentParamsJson,
        body: markDeliveredBodyJson,
        response: {
          200: successResponse(shipmentResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderShipmentController.markDelivered(
        request as AuthenticatedRequest,
        reply,
      ),
  );
}
