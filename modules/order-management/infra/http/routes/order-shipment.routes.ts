import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderShipmentController } from "../controllers/order-shipment.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  orderShipmentsParamsSchema,
  orderShipmentParamsSchema,
  createShipmentSchema,
  markShippedSchema,
  updateShipmentTrackingSchema,
  markDeliveredSchema,
  shipmentResponseSchema,
} from "../validation/order-shipment.schema";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];

export async function registerOrderShipmentRoutes(
  fastify: FastifyInstance,
  orderShipmentController: OrderShipmentController,
): Promise<void> {
  // Create shipment for an order
  fastify.post(
    "/orders/:orderId/shipments",
    {
      preValidation: [validateParams(orderShipmentsParamsSchema), validateBody(createShipmentSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Create a new shipment for an order",
        tags: ["Order Shipments"],
        summary: "Create Shipment",
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
          properties: {
            carrier: { type: "string" },
            service: { type: "string" },
            trackingNumber: { type: "string" },
            giftReceipt: { type: "boolean", default: false },
            pickupLocationId: { type: "string", format: "uuid" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: shipmentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderShipmentController.createShipment(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Get all shipments for an order
  fastify.get(
    "/orders/:orderId/shipments",
    {
      preValidation: [validateParams(orderShipmentsParamsSchema)],
      preHandler: authenticateUser,
      schema: {
        description: "Get all shipments for an order",
        tags: ["Order Shipments"],
        summary: "Get Order Shipments",
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
              data: {
                type: "array",
                items: shipmentResponseSchema,
              },
            },
          },
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
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific shipment by ID",
        tags: ["Order Shipments"],
        summary: "Get Shipment",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "shipmentId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: shipmentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderShipmentController.getShipment(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Mark shipment as shipped
  fastify.post(
    "/orders/:orderId/shipments/:shipmentId/mark-shipped",
    {
      preValidation: [validateParams(orderShipmentParamsSchema), validateBody(markShippedSchema)],
      preHandler: [authenticateUser],
      schema: {
        description:
          "Mark a shipment as shipped with carrier and tracking details",
        tags: ["Order Shipments"],
        summary: "Mark Shipment as Shipped",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "shipmentId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["carrier", "service", "trackingNumber"],
          properties: {
            carrier: { type: "string" },
            service: { type: "string" },
            trackingNumber: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: shipmentResponseSchema,
            },
          },
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
      preValidation: [validateParams(orderShipmentParamsSchema), validateBody(updateShipmentTrackingSchema)],
      preHandler: authenticateStaff,
      schema: {
        description: "Update shipment tracking information (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Update Shipment Tracking",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "shipmentId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["trackingNumber"],
          properties: {
            trackingNumber: { type: "string" },
            carrier: { type: "string" },
            service: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: shipmentResponseSchema,
            },
          },
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
      preValidation: [validateParams(orderShipmentParamsSchema), validateBody(markDeliveredSchema)],
      preHandler: authenticateStaff,
      schema: {
        description: "Mark a shipment as delivered (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Mark Shipment as Delivered",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "shipmentId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            deliveredAt: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: shipmentResponseSchema,
            },
          },
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
